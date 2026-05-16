import { useMemo, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { MessageCircle, Send, X } from "lucide-react";
import bitsyDefault from "../assets/Bitsy_default.png";

function normalize(text) {
  return (text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function renderMarkdown(text) {
  return DOMPurify.sanitize(marked.parse(text || ""));
}

function pickExample(lesson, titleMatch) {
  return lesson?.examples?.find((example) => example.title?.toLowerCase().includes(titleMatch));
}

function buildReply(question, lesson, challenge) {
  const q = normalize(question);
  const lessonTitle = lesson?.title || "this lesson";
  const lessonLanguage = lesson?.language || "html";
  const challengeTitle = challenge?.title || "your current task";

  if (!q) {
    return "Ask me about the lesson, your code, or the next thing to build.";
  }

  if (q.includes("navbar") || q.includes("nav")) {
    const example = pickExample(lesson, "navigation bar");
    return `Use a semantic \`<nav>\` element near the top of the page, usually inside \`<header>\`, then add links to each section.

${example?.code ? `\`\`\`html\n${example.code}\n\`\`\`` : "```html\n<nav>\n  <a href=\"#home\">Home</a>\n  <a href=\"#about\">About</a>\n  <a href=\"#projects\">Projects</a>\n  <a href=\"#contact\">Contact</a>\n</nav>"}

For ${lessonTitle}, that is the cleanest starting point. If you are on the HTML lesson, place it before \`<main>\`.`;
  }

  if (q.includes("about")) {
    return `Create a \`<section id=\"about\">\` with a heading and a short paragraph that introduces you.\n\n\`\`\`html\n<section id=\"about\">\n  <h2>About Me</h2>\n  <p>Write a short intro here.</p>\n</section>\n\`\`\`\n\nThat fits the structure expected in ${challengeTitle}.`;
  }

  if (q.includes("project") || q.includes("card")) {
    return `Use a \`<section id=\"projects\">\` and group each project in an \`<article>\`.\n\n\`\`\`html\n<section id=\"projects\">\n  <h2>Projects</h2>\n  <article>\n    <h3>Project Title</h3>\n    <p>Short description.</p>\n  </article>\n</section>\n\`\`\``;
  }

  if (q.includes("contact") || q.includes("form")) {
    return `Build a \`<form>\` with a name field and a message field, then use a submit button.\n\n\`\`\`html\n<section id=\"contact\">\n  <h2>Contact</h2>\n  <form>\n    <input type=\"text\" placeholder=\"Your name\" required>\n    <textarea placeholder=\"Your message\" required></textarea>\n    <button type=\"submit\">Send</button>\n  </form>\n</section>\n\`\`\``;
  }

  if (lessonLanguage === "css") {
    return `For CSS, start with layout and spacing. If you are styling the navbar, use Flexbox on the nav container, then add padding, gaps, and hover states. If you want, ask me about buttons, cards, or responsive layout.`;
  }

  if (lessonLanguage === "javascript") {
    return `For JavaScript, identify the element, attach an event listener, and update classes or text. In ${challengeTitle}, I can help with dark mode, mobile menus, or form validation.`;
  }

  return `I am here for ${lessonTitle}. Try asking how to build the navbar, the about section, the projects area, or the contact form.`;
}

export default function BitsyChat({ lesson, challenge }) {
  const [messages, setMessages] = useState([
    {
      role: "bitsy",
      text: "Tap me and ask how to build the navbar, about section, projects, or contact form.",
    },
  ]);
  const [prompt, setPrompt] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const quickPrompts = useMemo(
    () => [
      "How do I add the navbar to this site?",
      "How should I build the about section?",
      "How do I make the projects cards?",
    ],
    [],
  );

  const sendPrompt = (value) => {
    const question = value.trim();
    if (!question || isThinking) return;

    setIsOpen(true);
    setMessages((current) => [...current, { role: "user", text: question }]);
    setPrompt("");
    setIsThinking(true);

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        { role: "bitsy", text: buildReply(question, lesson, challenge) },
      ]);
      setIsThinking(false);
    }, 250);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 rounded-full border border-purple-200 bg-white/95 px-3 py-2 shadow-xl shadow-purple-200/50 backdrop-blur transition-transform hover:-translate-y-0.5 hover:shadow-2xl"
          aria-label="Open Bitsy chat"
        >
          <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-purple-200 bg-gradient-to-b from-purple-50 to-blue-50">
            <img src={bitsyDefault} alt="Bitsy" className="h-10 w-10 object-contain transition-transform group-hover:scale-105" />
          </span>
          <span className="hidden max-w-40 text-left sm:block">
            <span className="block text-sm font-bold text-purple-800">Bitsy</span>
            <span className="block text-xs text-slate-500">Ask me how to build this page</span>
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-700 text-white">
            <MessageCircle size={15} />
          </span>
        </button>
      ) : (
        <div className="flex w-[min(92vw,24rem)] flex-col overflow-hidden rounded-3xl border border-purple-200 bg-white shadow-2xl shadow-purple-300/30">
          <div className="flex items-center gap-3 border-b border-purple-100 bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-white">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10">
              <img src={bitsyDefault} alt="Bitsy avatar" className="h-9 w-9 object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-none">Bitsy</p>
              <p className="mt-1 text-xs text-white/80">Your coding buddy is here to talk through the lesson.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close Bitsy chat"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[28rem] space-y-3 overflow-y-auto bg-gradient-to-b from-purple-50/60 to-blue-50/50 px-3 py-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "bitsy" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-purple-200 bg-white shadow-sm">
                    <img src={bitsyDefault} alt="Bitsy" className="h-7 w-7 object-contain" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                    message.role === "user"
                      ? "rounded-br-md bg-slate-900 text-white"
                      : "rounded-bl-md border border-purple-100 bg-white text-slate-800"
                  }`}
                >
                  {message.role === "user" ? (
                    <p>{message.text}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none prose-p:my-0 prose-strong:text-purple-800 prose-code:text-purple-700" dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }} />
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-end gap-2 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-purple-200 bg-white shadow-sm">
                  <img src={bitsyDefault} alt="Bitsy" className="h-7 w-7 object-contain" />
                </div>
                <div className="rounded-2xl rounded-bl-md border border-purple-100 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                  Bitsy is thinking...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-purple-100 bg-white px-3 py-3">
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                sendPrompt(prompt);
              }}
            >
              <input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ask Bitsy something..."
                className="flex-1 rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-purple-400"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || isThinking}
                className="inline-flex items-center gap-1 rounded-xl bg-purple-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={14} />
                Ask
              </button>
            </form>

            <div className="mt-2 flex flex-wrap gap-2">
              {quickPrompts.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => sendPrompt(item)}
                  className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-800 transition-colors hover:bg-purple-100"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}