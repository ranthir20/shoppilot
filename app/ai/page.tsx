"use client";
import Sidebar from "@/components/Sidebar";

import { useEffect, useRef, useState } from "react";

type AIData = {
  summary: {
    totalProducts: number;
    totalCustomers: number;
    totalSales: number;
    totalPaid: number;
    totalDue: number;
    totalOrders: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  products: {
    id: number;
    name: string;
    category: string;
    price: number;
    stock: number;
  }[];
  lowStockProducts: {
    name: string;
    stock: number;
  }[];
  outOfStockProducts: {
    name: string;
  }[];
  customers: {
    name: string;
    phone: string;
    totalDue: number;
  }[];
  bestSellingProducts: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
};

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function AIPage() {
  const [data, setData] = useState<AIData | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I'm ShopPilot Assistant. Ask me about your sales, inventory, customers, or payments.",
    },
  ]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/ai");
        const result = await response.json();

        if (response.ok) {
          setData(result);
        }
      } catch (error) {
        console.error("Failed to load AI data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  const formatMoney = (value: number) =>
    `₹${value.toLocaleString("en-IN")}`;

  const answerQuestion = async () => {
    if (!question.trim() || !data) return;

    const userQuestion = question.trim();

    setMessages((current) => [
      ...current,
      {
        role: "user",
        text: userQuestion,
      },
    ]);

    setQuestion("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userQuestion,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to get AI response");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: result.answer,
        },
      ]);
    } catch (error) {
      console.error("AI request failed:", error);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "Sorry, I couldn't process that question right now. Please try again.",
        },
      ]);
    }
  };

  const quickQuestions = [
    "What products are low in stock?",
    "Who owes me money?",
    "What are my best-selling products?",
    "How much sales have I made?",
  ];

  return (
    <main className="h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <section className="ml-64 flex h-screen flex-col overflow-hidden p-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            AI Assistant
          </h2>
          <p className="mt-1 text-gray-500">
            Ask questions about your business.
          </p>
        </div>

        <div className="mt-8 flex min-h-0 flex-1 flex-col rounded-xl border bg-white">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-2xl whitespace-pre-line rounded-2xl px-5 py-3 ${
                    message.role === "user"
                      ? "bg-black text-white"
                      : "border border-gray-200 bg-white text-gray-900"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-sm text-gray-500">
                Loading your business data...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              {quickQuestions.map((item) => (
                <button
                  key={item}
                  onClick={() => setQuestion(item)}
                  className="rounded-full border px-4 py-2 text-sm text-black hover:bg-gray-50"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    answerQuestion();
                  }
                }}
                placeholder="Ask something about your business..."
                className="flex-1 rounded-lg border px-4 py-3 text-black placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-300"
              />

              <button
                onClick={answerQuestion}
                disabled={loading || !question.trim()}
                className="rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Ask
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
