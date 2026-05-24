import { useState, useEffect } from "react";
import api from "../api";
import "../styles/_glitch_chat.scss";
import { BotIcon } from "./ClassSession";

interface Message {
  role: "user" | "bot";
  text: string;
}

interface GlitchChatProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: any;
}

export default function GlitchChat({
  isOpen,
  onClose,
  lessonId,
}: GlitchChatProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem("glitch_chat_history");
    return saved
      ? JSON.parse(saved)
      : [
          {
            role: "bot",
            text: "Salut! Sunt Glitch 🤖. Ce nelămuriri ai din lecția curentă?",
          },
        ];
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("glitch_chat_history", JSON.stringify(messages));
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.post("api/glitch/chat/", {
        lesson_id: lessonId,
        message: userMessage.text,
        history: messages,
      });

      const botMessage: Message = { role: "bot", text: response.data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Eroare Glitch:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Ups! Am o eroare de sistem. Mai încearcă o dată.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="glitch-widget">
      <div className="glitch-header">
        <h3>
          Glitch AI <BotIcon />
        </h3>
        <button
          onClick={onClose}
          className="close-btn"
          aria-label="Închide chat"
        >
          ✖
        </button>
      </div>

      <div className="glitch-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.text}
          </div>
        ))}
        {isLoading && <div className="message bot">Glitch scrie...</div>}
      </div>

      <form onSubmit={handleSend} className="glitch-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Întreabă-mă ceva..."
          disabled={isLoading}
        />
        <button
          type="submit"
          className="btn--primary"
          disabled={isLoading || !input.trim()}
        >
          Trimite
        </button>
      </form>
    </div>
  );
}
