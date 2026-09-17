"""Predict whether a delayed shipment should be redirected to nearby markets.

This is an explainable baseline until the platform has enough labelled delivery
and spoilage outcomes to train a supervised model. It combines predicted lateness,
produce freshness windows, cold-chain conditions, distance, and recent demand.
"""

from datetime import datetime, timedelta, timezone

from sklearn.linear_model import LinearRegression
from sqlalchemy.orm import Session

from app.models.models import DemandRecord, Retailer, Shipment
from app.services.geo import haversine_km
from app.services.spoilage_prediction_service import risk_score

FRESHNESS_HOURS = {
    "Leafy Greens": 18.0,
    "Strawberry": 24.0,
    "Tomato": 48.0,
    "Grapes": 72.0,
    "Milk": 24.0,
    "Banana": 96.0,
    "Mango": 120.0,
    "Apple": 168.0,
}
MAX_MARKET_DISTANCE_KM = 80.0


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _arrival(shipment: Shipment, now: datetime) -> datetime:
    if shipment.current_latitude is None or shipment.current_longitude is None:
        return now + timedelta(minutes=shipment.eta_minutes or 0)
    distance = haversine_km(
        shipment.current_latitude,
        shipment.current_longitude,
        shipment.destination_latitude,
        shipment.destination_longitude,
    )
    speed = max(shipment.speed_kmph, 12.0)
    return now + timedelta(hours=distance / speed)


def _recent_demand(db: Session, produce_type: str, days: int = 14) -> float:
    since = _now() - timedelta(days=days)
    rows = (
        db.query(DemandRecord)
        .filter(
            DemandRecord.produce_type == produce_type,
            DemandRecord.recorded_on >= since,
        )
        .all()
    )
    return sum(row.quantity for row in rows) / max(len(rows), 1)


def _features(shipment: Shipment) -> list[float]:
    distance = haversine_km(
        shipment.source_latitude,
        shipment.source_longitude,
        shipment.destination_latitude,
        shipment.destination_longitude,
    )
    return [
        distance,
        shipment.quantity,
        shipment.speed_kmph or 0.0,
        shipment.temperature or 0.0,
        shipment.humidity or 0.0,
    ]


def _ml_delay_prediction(db: Session, shipment: Shipment) -> dict | None:
    """Learn historical delivery delay when enough completed examples exist."""
    rows = (
        db.query(Shipment)
        .filter(
            Shipment.delivered_at.is_not(None),
            Shipment.delivery_deadline.is_not(None),
            Shipment.departure_time.is_not(None),
        )
        .all()
    )
    if len(rows) < 8:
        return None

    training_x = [_features(row) for row in rows]
    training_y = [
        max(0.0, (row.delivered_at - row.delivery_deadline).total_seconds() / 60)
        for row in rows
    ]
    model = LinearRegression().fit(training_x, training_y)
    prediction = max(0.0, float(model.predict([_features(shipment)])[0]))
    return {
        "predicted_delay_minutes": round(prediction, 1),
        "training_examples": len(rows),
        "model": "LinearRegression",
    }


def predict_redistribution(db: Session, shipment: Shipment) -> dict:
    now = _now()
    arrival = _arrival(shipment, now)
    deadline = shipment.delivery_deadline
    late_minutes = max(0.0, (arrival - deadline).total_seconds() / 60) if deadline else 0.0
    freshness_hours = FRESHNESS_HOURS.get(shipment.produce_type, 72.0)
    transit_hours = max(0.0, (arrival - (shipment.departure_time or shipment.created_at)).total_seconds() / 3600)
    chain_risk = risk_score(shipment.produce_type, shipment.temperature)
    freshness_ratio = transit_hours / freshness_hours
    ml_prediction = _ml_delay_prediction(db, shipment)
    ml_delay = ml_prediction["predicted_delay_minutes"] if ml_prediction else 0.0
    combined_late_minutes = max(late_minutes, 0.7 * late_minutes + 0.3 * ml_delay)

    risk_score_value = min(
        1.0,
        (combined_late_minutes / 240) * 0.45
        + freshness_ratio * 0.35
        + chain_risk["score"] * 0.20,
    )
    should_redistribute = risk_score_value >= 0.35 or late_minutes >= 30

    current_latitude = shipment.current_latitude or shipment.source_latitude
    current_longitude = shipment.current_longitude or shipment.source_longitude
    daily_demand = _recent_demand(db, shipment.produce_type)
    retailers = db.query(Retailer).all()
    candidates = []
    for retailer in retailers:
        distance = haversine_km(
            current_latitude,
            current_longitude,
            retailer.latitude,
            retailer.longitude,
        )
        if distance > MAX_MARKET_DISTANCE_KM:
            continue
        distance_score = max(0.0, 1 - distance / MAX_MARKET_DISTANCE_KM)
        demand_score = min(1.0, daily_demand / max(shipment.quantity, 1.0))
        score = 0.6 * distance_score + 0.4 * demand_score
        candidates.append(
            {
                "retailer_id": retailer.retailer_id,
                "name": retailer.name,
                "location": retailer.location,
                "distance_km": round(distance, 1),
                "estimated_daily_demand": round(daily_demand, 1),
                "score": round(score * 100, 1),
                "suggested_quantity": 0.0,
                "reason": f"{distance:.1f} km away with recent {shipment.produce_type} demand",
            }
        )
    candidates.sort(key=lambda candidate: candidate["score"], reverse=True)
    for candidate in candidates[:3]:
        candidate["suggested_quantity"] = round(
            shipment.quantity / max(min(len(candidates), 3), 1), 1
        )

    risk_level = "LOW"
    if risk_score_value >= 0.7:
        risk_level = "HIGH"
    elif risk_score_value >= 0.35:
        risk_level = "MEDIUM"

    reasons = []
    if combined_late_minutes:
        reasons.append(f"Predicted arrival is {combined_late_minutes:.0f} minutes after the deadline")
    if freshness_ratio >= 0.5:
        reasons.append(f"Transit uses {transit_hours:.1f} of an estimated {freshness_hours:.0f} fresh hours")
    if chain_risk["score"] > 0:
        reasons.append(f"Cold-chain reading is {chain_risk['risk'].lower()} risk")
    if not reasons:
        reasons.append("Current ETA is within the delivery window and freshness buffer")

    return {
        "shipment_id": shipment.shipment_id,
        "produce_type": shipment.produce_type,
        "risk": risk_level,
        "risk_score": round(risk_score_value, 2),
        "predicted_arrival": arrival.isoformat(),
        "delivery_deadline": deadline.isoformat() if deadline else None,
        "late_minutes": round(late_minutes, 1),
        "ml_prediction": ml_prediction,
        "freshness_window_hours": freshness_hours,
        "should_redistribute": should_redistribute,
        "reasons": reasons,
        "recommendations": candidates[:3],
        "method": "ETA + LinearRegression delay model + freshness-window, cold-chain, distance, and demand ranker",
    }