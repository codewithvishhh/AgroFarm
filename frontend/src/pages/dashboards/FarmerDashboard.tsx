import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";

import { listStagger } from "../../animations/variants";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { Loader } from "../../components/Loader";
import { Panel } from "../../components/Panel";
import { ProgressTrack } from "../../components/ProgressTrack";
import { ShipmentForm } from "../../components/ShipmentForm";
import { ShipmentTimeline } from "../../components/ShipmentTimeline";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../hooks/useAuth";
import { useFetch } from "../../hooks/useFetch";
import { mergeShipment, useLiveEvent } from "../../hooks/useLive";
import { shipmentsApi, vehiclesApi, warehousesApi } from "../../services/api";
import type { Shipment } from "../../types";
import { formatQuantity, formatRupees, timeAgo } from "../../utils/format";

export function FarmerDashboard() {
  const { session } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [formOpen, setFormOpen] = useState(false);

  const state = useFetch(
    () => shipmentsApi.list().then((rows) => (setShipments(rows), rows)),
    [],
    "farmer:shipments",
  );
  const vehicles = useFetch(() => vehiclesApi.list(), [], "vehicles");
  const retailers = useFetch(() => warehousesApi.retailers(), [], "retailers");
  const warehouses = useFetch(() => warehousesApi.list(), [], "warehouses");

  useLiveEvent(
    ["SHIPMENT_CREATED", "SHIPMENT_UPDATED"],
    useCallback((message) => {
      setShipments((current) => mergeShipment(current, message.data as Shipment));
    }, []),
  );

  const mine = shipments.filter(
    (shipment) => !session || shipment.created_by === session.name,
  );
  const scope = mine.length > 0 ? mine : shipments;

  const today = new Date().toDateString();
  const todaysProduce = scope.filter(
    (shipment) => new Date(`${shipment.created_at}Z`).toDateString() === today,
  );
  const active = scope.filter((shipment) =>
    ["PENDING", "ASSIGNED", "IN_TRANSIT", "DELAYED"].includes(shipment.status),
  );
  const pendingCollection = scope.filter((shipment) =>
    ["REQUESTED", "ACCEPTED"].includes(shipment.collection_status),
  );
  const delivered = scope.filter((shipment) => shipment.status === "DELIVERED");
  const totalQuantity = scope.reduce(
    (sum, shipment) => sum + shipment.quantity,
    0,
  );
  const value = delivered.reduce(
    (sum, shipment) => sum + shipment.estimated_value,
    0,
  );

  if (state.loading && shipments.length === 0) {
    return <Loader label="Loading your produce" />;
  }

  return (
    <div className="space-y-6">
      <motion.div
        variants={listStagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatCard
          label="Today's produce"
          value={todaysProduce.length}
          hint={`${formatQuantity(
            todaysProduce.reduce((sum, item) => sum + item.quantity, 0),
            "kg",
          )} raised today`}
          tone="crop"
        />
        <StatCard
          label="Total quantity supplied"
          value={formatQuantity(totalQuantity, "")}
          hint={`${scope.length} requests raised`}
          tone="chill"
        />
        <StatCard
          label="Active shipments"
          value={active.length}
          hint={`${pendingCollection.length} waiting for pickup`}
          tone="harvest"
        />
        <StatCard
          label="Estimated value delivered"
          value={formatRupees(value)}
          hint={`${delivered.length} deliveries completed`}
        />
      </motion.div>

      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>Create produce request</Button>
      </div>

      <Panel
        title="My shipments"
        description="Every load you raised, with its current stage"
        bodyClassName="p-0"
        action={
          <Link
            to="/shipments"
            className="px-5 text-[11px] text-moss transition-colors hover:text-crop"
          >
            See all
          </Link>
        }
      >
        {scope.length === 0 ? (
          <EmptyState
            title="No produce raised yet"
            hint="Create a request with the produce, quantity, and the retailer it should reach."
            action={
              <Button onClick={() => setFormOpen(true)}>
                Create produce request
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-soil-600/50">
            {scope.slice(0, 6).map((shipment) => (
              <li key={shipment.shipment_id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/shipments/${shipment.shipment_id}`}
                      className="font-mono text-xs text-crop hover:underline"
                    >
                      {shipment.shipment_id}
                    </Link>
                    <p className="mt-1 text-xs text-husk">
                      {shipment.produce_type} ·{" "}
                      {formatQuantity(shipment.quantity, shipment.quantity_unit)}{" "}
                      · to {shipment.destination}
                    </p>
                    <p className="mt-0.5 text-[11px] text-moss">
                      Vehicle{" "}
                      {shipment.vehicle?.vehicle_number ?? "not assigned yet"} ·
                      raised {timeAgo(shipment.created_at)}
                    </p>
                  </div>
                  <StatusBadge
                    status={shipment.status}
                    pulse={shipment.status === "IN_TRANSIT"}
                  />
                </div>

                <div className="mt-3">
                  <ShipmentTimeline stage={shipment.stage} />
                </div>

                {shipment.status === "IN_TRANSIT" && (
                  <div className="mt-3">
                    <ProgressTrack
                      value={shipment.progress_percentage}
                      label={`${shipment.progress_percentage.toFixed(0)}% of the route covered`}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <ShipmentForm
        open={formOpen}
        vehicles={vehicles.data ?? []}
        retailers={retailers.data ?? []}
        warehouses={warehouses.data ?? []}
        onClose={() => setFormOpen(false)}
        onCreated={(shipment) =>
          setShipments((current) => [shipment, ...current])
        }
      />
    </div>
  );
}
