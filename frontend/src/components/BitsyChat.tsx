import { useMemo, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Bot, Send, X } from "lucide-react";
import type { Lesson, Task } from "../types";

function normalize(text: string) {
  return (text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function renderMarkdown(text: string) {
  return DOMPurify.sanitize(marked.parse(text || ""));
}

function pickExample(lesson: Lesson | null, titleMatch: string) {
  return lesson?.examples?.find((example) =>
    example.title?.toLowerCase().includes(titleMatch)
  );
}

/* Code analysis helpers */
function getUnclosedTags(html: string) {
  const open = html.match(/<([a-z][a-z0-9]*)\b[^>]*>/gi) || [];
  const close = html.match(/<\/([a-z][a-z0-9]*)>/gi) || [];
  const needClosing = ["div", "span", "p", "section", "article", "header", "footer", "nav", "main", "ul", "ol", "li", "form", "table", "tr", "td", "th", "body", "html"];
  const counts: Record<string, number> = {};
  open.forEach((tag) => {
    const name = tag.match(/<([a-z][a-z0-9]*)\b/i)?.[1].toLowerCase();
    if (name && needClosing.includes(name)) counts[name] = (counts[name] || 0) + 1;
  });
  close.forEach((tag) => {
    const name = tag.match(/<\/([a-z][a-z0-9]*)>/i)?.[1].toLowerCase();
    if (name && needClosing.includes(name)) counts[name] = (counts[name] || 0) - 1;
  });
  return Object.entries(counts).filter(([, diff]) => diff !== 0).map(([tag]) => tag);
}

function missingSemicolons(js: string) {
  const lines = js.split("\n");
  const offenders: number[] = [];
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (
      trimmed.length > 0 &&
      !trimmed.endsWith("{") &&
      !trimmed.endsWith("}") &&
      !trimmed.endsWith(";") &&
      !trimmed.endsWith(",") &&
      !trimmed.startsWith("//") &&
      !/^(if|else|for|while|switch|try|catch|function\s+\w+\s*\()/i.test(trimmed)
    ) {
      offenders.push(idx + 1);
    }
  });
  return offenders;
}

function invalidCssSelectors(css: string) {
  const bad: Array<{ line: number; sel: string }> = [];
  const lines = css.split("\n");
  lines.forEach((line, idx) => {
    const raw = line.trim();
    if (raw.startsWith(".")) {
      const sel = raw.split("{")[0].trim();
      if (/\.\d/.test(sel)) bad.push({ line: idx + 1, sel });
    }
    if (raw.includes(" #") && !raw.includes("[id")) {
      const sel = raw.split("{")[0].trim();
      if (/#\s/.test(sel)) bad.push({ line: idx + 1, sel });
    }
  });
  return bad;
}

function analyzeCode(code: string, language: string) {
  if (!code || code.trim().length < 3) return null;

  const lang = normalize(language);
  let issues: string[] = [];
  const snippet = code.length > 400 ? code.slice(0, 400) + "\n..." : code;

  if (lang === "html" || code.trim().startsWith("<")) {
    const unclosed = getUnclosedTags(code);
    if (unclosed.length) issues.push(`Unclosed tags detected: **${unclosed.join(", ")}**. Make sure every opening tag has a matching closing tag.`);
    if (!code.includes("<!DOCTYPE") && !code.includes("<html")) issues.push("It looks like your HTML might be missing a proper `<!DOCTYPE html>` or `<html>` root element.");
  }

  if (lang === "css" || code.includes("{")) {
    const badSelectors = invalidCssSelectors(code);
    if (badSelectors.length) issues.push(`Potential invalid selector(s) on line(s) ${badSelectors.map((b) => b.line).join(", ")}: \`${badSelectors.map((b) => b.sel).join("`, `")}\`. Avoid spaces between a dot/hash and the name.`);
    if (code.split("}").length < code.split("{").length) issues.push("Looks like there may be more opening `{` than closing `}` braces.");
  }

  if (lang === "javascript" || code.includes("function") || code.includes("const ") || code.includes("let ")) {
    const noSemi = missingSemicolons(code);
    if (noSemi.length) issues.push(`Lines ${noSemi.slice(0, 5).join(", ")}${noSemi.length > 5 ? "..." : ""} might be missing semicolons. While JS has ASI, explicit semicolons prevent surprises.`);
    if (code.includes("var ")) issues.push("Consider replacing `var` with `let` or `const` for clearer scoping.");
    const unmatchedParens = (code.match(/\(/g) || []).length - (code.match(/\)/g) || []).length;
    if (unmatchedParens !== 0) issues.push(`Parentheses mismatch detected (${unmatchedParens > 0 ? "extra opening" : "extra closing"}). Double-check your function calls and expressions.`);
  }

  if (!issues.length) return null;

  return {
    summary: issues.join("\n\n"),
    snippet,
  };
}

function buildReply(question: string, lesson: Lesson | null, challenge: Task | null, code: string, language: string) {
  const q = normalize(question);
  const lessonTitle = lesson?.title || "this lesson";
  const lessonLanguage = lesson?.language || language || "html";
  const challengeTitle = challenge?.title || "your current task";
  const analysis = analyzeCode(code, lessonLanguage);

  if (!q) {
    return "Ask me about the lesson, your code, or the next thing to build.";
  }

  if (q.includes("code") || q.includes("my code") || q.includes("fix") || q.includes("issue") || q.includes("error")) {
    if (analysis) {
      return `Here is what I noticed in your current code:\n\n${analysis.summary}\n\n\`\`\`${lessonLanguage}\n${analysis.snippet}\n\`\`\`\n\nTake a look at those spots and try the fix. If it still feels off, paste the specific line and I will dig deeper.`;
    }
    return `Your code looks clean so far—nice work!\n\n\`\`\`${lessonLanguage}\n${code?.slice(0, 300) || "// Your code here"}\n\`\`\`\n\nIf something is not behaving as expected, tell me which part and I will help you debug it.`;
  }

  if (q.includes("navbar") || q.includes("nav")) {
    const example = pickExample(lesson, "navigation bar");
    return `Use a semantic \`<nav>\` element near the top of the page, usually inside \`<header>\`, then add links to each section.\n\n${example?.code ? `\`\`\`html\n${example.code}\n\`\`\`` : "\`\`\`html\n<nav>\n  <a href=\"#home\">Home</a>\n  <a href=\"#about\">About</a>\n  <a href=\"#projects\">Projects</a>\n  <a href=\"#contact\">Contact</a>\n</nav>\n\`\`\`"}\n\nFor ${lessonTitle}, that is the cleanest starting point. If you are on the HTML lesson, place it before \`<main>\`.`;
  }

  if (q.includes("about")) {
    return `Create a \`<section id="about">\` with a heading and a short paragraph that introduces you.\n\n\`\`\`html\n<section id="about">\n  <h2>About Me</h2>\n  <p>Write a short intro here.</p>\n</section>\n\`\`\`\n\nThat fits the structure expected in ${challengeTitle}.`;
  }

  if (q.includes("project") || q.includes("card")) {
    return `Use a \`<section id="projects">\` and group each project in an \`<article>\`.\n\n\`\`\`html\n<section id="projects">\n  <h2>Projects</h2>\n  <article>\n    <h3>Project Title</h3>\n    <p>Short description.</p>\n  </article>\n</section>\n\`\`\``;
  }

  if (q.includes("contact") || q.includes("form")) {
    return `Build a \`<form>\` with a name field and a message field, then use a submit button.\n\n\`\`\`html\n<section id="contact">\n  <h2>Contact</h2>\n  <form>\n    <input type="text" placeholder="Your name" required>\n    <textarea placeholder="Your message" required></textarea>\n    <button type="submit">Send</button>\n  </form>\n</section>\n\`\`\``;
  }

  if (lessonLanguage === "css") {
    return `For CSS, start with layout and spacing. If you are styling the navbar, use Flexbox on the nav container, then add padding, gaps, and hover states. If you want, ask me about buttons, cards, or responsive layout.`;
  }

  if (lessonLanguage === "javascript") {
    return `For JavaScript, identify the element, attach an event listener, and update classes or text. In ${challengeTitle}, I can help with dark mode, mobile menus, or form validation.`;
  }

  return `I am here for ${lessonTitle}. Try asking how to build the navbar, the about section, the projects area, or the contact form.`;
}

interface BitsyChatProps {
  lesson: Lesson | null;
  challenge: Task | null;
  code: string;
  language: string;
}

export default function BitsyChat({ lesson, challenge, code, language }: BitsyChatProps) {
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "bitsy"; text: string }>
  >([
    { role: "bitsy", text: "Tap me and ask how to build the navbar, about section, projects, or contact form." },
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
    []
  );

  const sendPrompt = (value: string) => {
    const question = value.trim();
    if (!question || isThinking) return;

    setIsOpen(true);
    setMessages((current) => [...current, { role: "user", text: question }]);
    setPrompt("");
    setIsThinking(true);

    setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          role: "bitsy",
          text: buildReply(question, lesson, challenge, code, language),
        },
      ]);
      setIsThinking(false);
    }, 250);
  };

  return (
    <div className="bitsy-chat-root">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
          aria-label="Open Bitsy chat"
        >
          <Bot size={18} />
          <span>Ask Bitsy</span>
        </button>
      ) : (
        <div className="flex flex-col max-h-96 rounded-xl border border-border bg-surface shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface-hover">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot size={18} />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Bitsy</p>
              <p className="text-xs text-muted">Your coding assistant</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="ml-auto p-1 hover:bg-surface-hover rounded text-muted"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {message.role === "bitsy" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot size={14} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "bg-surface border border-border text-foreground"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="leading-relaxed">{message.text}</p>
                  ) : (
                    <div
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }}
                    />
                  )}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bot size={14} />
                </div>
                <div className="px-4 py-2 rounded-lg bg-surface border border-border text-muted text-sm">
                  Bitsy is thinking...
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-surface">
            <form
              className="flex gap-2 mb-3"
              onSubmit={(e) => {
                e.preventDefault();
                sendPrompt(prompt);
              }}
            >
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask Bitsy something..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isThinking}
              />
              <button
                type="submit"
                disabled={!prompt.trim() || isThinking}
                className="inline-flex items-center gap-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={14} />
                Ask
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => sendPrompt(item)}
                  className="px-3 py-1 text-xs rounded-full border border-border bg-surface-hover hover:bg-surface text-muted transition-colors"
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