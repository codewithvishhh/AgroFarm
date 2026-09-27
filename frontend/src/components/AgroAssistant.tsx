import { Bot, ChevronRight, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../i18n/LanguageContext";
import { assistantApi } from "../services/api";
import { ROLE_LABEL } from "../utils/navigation";

interface Message {
  id: number;
  from: "assistant" | "user";
  text: string;
}

function AssistantText({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split(/\n+/).map((line, index) => {
        const cleaned = line.replace(/\*\*/g, "").replace(/^#{1,6}\s*/, "");
        const numbered = cleaned.match(/^\s*(\d+)[.)]\s+(.+)/);

        if (numbered) {
          return (
            <div key={`${line}-${index}`} className="flex gap-2">
              <span className="font-semibold text-crop">{numbered[1]}.</span>
              <span>{numbered[2]}</span>
            </div>
          );
        }

        if (cleaned.trim().startsWith("- ")) {
          return (
            <div key={`${line}-${index}`} className="flex gap-2">
              <span className="text-crop">•</span>
              <span>{cleaned.trim().slice(2)}</span>
            </div>
          );
        }

        return cleaned.trim() ? <p key={`${line}-${index}`}>{cleaned}</p> : null;
      })}
    </div>
  );
}

const SUGGESTIONS = [
  "What should I focus on today?",
  "Show me the latest shipment risks",
  "How can I reduce spoilage?",
];

function getReply(prompt: string, roleLabel: string, language: "en" | "hi") {
  const question = prompt.toLowerCase();

  if (language === "hi") {
    if (question.includes("tomato") || question.includes("टमाटर")) {
      return "टमाटर की ताज़गी बनाए रखने के लिए:\n1. फटे या दबे फल अलग करें।\n2. पके टमाटर को हवा वाली जगह पर लगभग 12-15°C में रखें।\n3. कच्चे टमाटर को पके फलों से अलग रखें।\n4. ढुलाई के दौरान तापमान और नुकसान की जाँच करें।";
    }
    if (question.includes("spoilage") || question.includes("खराब")) {
      return "उपज खराब होने का जोखिम घटाने के लिए:\n1. तापमान और देरी के अलर्ट जाँचें।\n2. जोखिम वाली उपज को उपयुक्त गोदाम में भेजें।\n3. खराब माल अलग करके इन्वेंटरी में दर्ज करें।\n4. कम शेल्फ-लाइफ़ वाली उपज को पहले भेजें।";
    }
    if (question.includes("shipment") || question.includes("खेप") || question.includes("delivery")) {
      return "खेप की स्थिति के लिए Shipments खोलें और वाहन की लाइव स्थिति तथा ETA देखने के लिए Tracking चुनें। तापमान, देरी और मार्ग संबंधी अलर्ट पहले जाँचें।";
    }
    if (question.includes("inventory") || question.includes("stock") || question.includes("स्टॉक")) {
      return "कम स्टॉक और हाल की आवाजाही देखने के लिए Inventory खोलें। अगला संग्रह तय करने से पहले Forecast में अनुमानित मांग की तुलना उपलब्ध स्टॉक से करें।";
    }
    return `${roleLabel} के रूप में आज सक्रिय अलर्ट और देरी से चल रही खेपों से शुरुआत करें। फिर डैशबोर्ड पर उन मामलों को देखें जिन पर निर्णय लेना ज़रूरी है।`;
  }

  if (question.includes("tomato") || question.includes("tomatoes")) {
    return "For tomatoes, slow ripening without trapping moisture:"
      + "\n1. Sort immediately: remove cracked, bruised, leaking, or moldy fruit."
      + "\n2. Store ripe tomatoes around 12-15°C with good airflow; avoid direct sun and condensation."
      + "\n3. Keep unripe tomatoes separate from ripe fruit because ripening gas speeds softening."
      + "\n4. Use shallow, ventilated crates with padding. Do not stack heavily or wash fruit before storage."
      + "\n5. During transport, secure the load, keep the cold chain steady, and inspect temperature and damage at arrival."
      + "\nCommon mistake: storing tomatoes too cold for too long can cause chilling injury and reduce flavor.";
  }

  if (question.includes("spoilage") || question.includes("fresh")) {
    return "To reduce produce spoilage across AgroFarm:"
      + "\n1. Check alerts and telemetry first for temperature excursions or delayed shipments."
      + "\n2. Move at-risk produce to the nearest suitable warehouse with available capacity."
      + "\n3. Separate damaged or overripe produce from healthy stock and record the movement."
      + "\n4. Use the Forecast screen to prioritize produce with the shortest shelf life."
      + "\n5. Notify the receiving team before dispatch when a shipment needs priority handling.";
  }
  if (question.includes("shipment") || question.includes("delivery") || question.includes("risk")) {
    return "Open Shipments for the live queue, then use Tracking to inspect vehicle telemetry and ETA. Alerts will surface temperature, delay, and route exceptions that need attention first.";
  }
  if (question.includes("inventory") || question.includes("stock")) {
    return "Check Inventory for low-stock items and recent movements. Forecast can help compare expected demand with current availability before you allocate the next collection.";
  }
  if (question.includes("today") || question.includes("focus") || question.includes("help")) {
    return `As a ${roleLabel}, begin with active alerts and any delayed shipments. Then check the dashboard exceptions: they are the fastest way to find work that needs a decision today.`;
  }

  return "I can help you navigate shipments, inventory, forecasts, alerts, and fleet activity. Try asking about today's priorities, shipment risks, or reducing spoilage.";
}

function isUsefulAnswer(answer: string) {
  const normalized = answer.trim().toLowerCase();
  return (
    normalized.length >= 80 &&
    !normalized.includes("short recommendation?") &&
    !normalized.includes("3-5") &&
    !/^\W+$/.test(normalized)
  );
}

export function AgroAssistant() {
  const { session } = useAuth();
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const roleLabel = session ? t(ROLE_LABEL[session.role]) : "team member";

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, thinking]);

  async function submit(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || thinking) return;

    const id = Date.now();
    setMessages((current) => [...current, { id, from: "user", text: trimmed }]);
    setDraft("");
    setThinking(true);

    try {
      const response = await assistantApi.chat([
        ...messages.map(({ from, text }) => ({
          role: from,
          content: text,
        })),
        { role: "user", content: trimmed },
      ], language);
      const context = [...messages.map(({ text }) => text), trimmed].join(" ");
      const answer = isUsefulAnswer(response)
        ? response
        : getReply(context, roleLabel, language);
      setMessages((current) => [...current, { id: id + 1, from: "assistant", text: answer }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: id + 1,
          from: "assistant",
          text: language === "hi"
            ? `${getReply(trimmed, roleLabel, language)} Gemini अभी उपलब्ध नहीं है, इसलिए यह स्थानीय सुझाव है।`
            : `${getReply(trimmed, roleLabel, language)} Gemini is currently unavailable, so this is a local guidance response.`,
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(draft);
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6">
      {open && (
        <section
          aria-label={t("AgroFarm assistant")}
          className="mb-3 flex h-[min(620px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-soil-500 bg-soil-800 shadow-2xl shadow-black/40"
        >
          <header className="flex items-center justify-between border-b border-husk/8 bg-canopy/60 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-crop/15 text-crop">
                <Bot size={19} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-husk">{t("AgroFarm assistant")}</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-moss">
                  <span className="h-1.5 w-1.5 rounded-full bg-crop" />
                  {t("Ready to help with operations")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-moss transition-colors hover:bg-soil-700 hover:text-husk"
              aria-label={t("Close assistant")}
            >
              <X size={16} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col justify-end">
                <div className="mb-5 rounded-xl border border-crop/20 bg-crop/5 p-4">
                  <div className="mb-3 flex items-center gap-2 text-crop">
                    <Sparkles size={15} />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                      {t("Quick start")}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-husk">
                    {t("Ask me about your supply chain, exceptions, or what deserves attention next.")}
                  </p>
                </div>
                <div className="space-y-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      onClick={() => submit(suggestion)}
                      className="flex w-full items-center justify-between rounded-lg border border-soil-600 px-3 py-2.5 text-left text-xs text-moss transition-colors hover:border-crop/50 hover:text-husk"
                    >
                      {t(suggestion)}
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 ${
                        message.from === "user"
                          ? "rounded-br-md bg-crop text-soil-900"
                          : "rounded-bl-md border border-husk/12 bg-canopy/50 backdrop-blur/70 text-husk"
                      }`}
                    >
                      {message.from === "assistant" ? (
                        <AssistantText text={message.text} />
                      ) : (
                        message.text
                      )}
                    </div>
                  </div>
                ))}
                {thinking && (
                  <div className="flex items-center gap-1.5 text-moss" aria-label={t("Assistant is thinking")}>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-crop" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-crop [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-crop [animation-delay:240ms]" />
                  </div>
                )}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <div className="border-t border-husk/8 bg-canopy/40 p-3 backdrop-blur">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setMessages([])}
                className="mb-2 text-[10px] text-moss transition-colors hover:text-husk"
              >
                {t("Clear conversation")}
              </button>
            )}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <label className="sr-only" htmlFor="assistant-message">{t("Message AgroFarm assistant")}</label>
              <input
                id="assistant-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={t("Ask about operations...")}
                className="min-w-0 flex-1 rounded-lg border border-husk/12 bg-soil-800/55 backdrop-blur px-3 py-2.5 text-xs text-husk placeholder:text-moss/70 focus:border-crop/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!draft.trim() || thinking}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-crop text-soil-900 transition-colors hover:bg-crop/90 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={t("Send message")}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-crop text-soil-900 shadow-lg shadow-crop/20 transition-transform hover:scale-105 hover:bg-crop/90"
        aria-label={t(open ? "Close AgroFarm assistant" : "Open AgroFarm assistant")}
        aria-expanded={open}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </div>
  );
}