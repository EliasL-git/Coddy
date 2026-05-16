import { useMemo, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { MessageCircle, Send, X } from "lucide-react";
import bitsyDefault from "../assets/Bitsy_default.png";
import "./BitsyChat.css";

function normalize(text) {
  return (text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function renderMarkdown(text) {
  return DOMPurify.sanitize(marked.parse(text || ""));
}

function pickExample(lesson, titleMatch) {
  return lesson?.examples?.find((example) =>
    example.title?.toLowerCase().includes(titleMatch)
  );
}

/* ───── Code analysis helpers ───── */
function getUnclosedTags(html) {
  const open = html.match(/<([a-z][a-z0-9]*)\b[^>]*>/gi) || [];
  const close = html.match(/<\/([a-z][a-z0-9]*)>/gi) || [];
  const needClosing = ["div", "span", "p", "section", "article", "header", "footer", "nav", "main", "ul", "ol", "li", "form", "table", "tr", "td", "th", "body", "html"];
  const counts = {};
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

function missingSemicolons(js) {
  const lines = js.split("\n");
  const offenders = [];
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

function invalidCssSelectors(css) {
  const bad = [];
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

function analyzeCode(code, language) {
  if (!code || code.trim().length < 3) return null;

  const lang = normalize(language);
  let issues = [];
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

/* ───── Reply builder (with code awareness) ───── */
function buildReply(question, lesson, challenge, code, language) {
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
    return `Use a semantic \`<nav>\` element near the top of the page, usually inside \`<header>\`, then add links to each section.

${example?.code ? `\`\`\`html\n${example.code}\n\`\`\`` : "```html\n<nav>\n  <a href=\"#home\">Home</a>\n  <a href=\"#about\">About</a>\n  <a href=\"#projects\">Projects</a>\n  <a href=\"#contact\">Contact</a>\n</nav>"}

For ${lessonTitle}, that is the cleanest starting point. If you are on the HTML lesson, place it before \`<main>\`.`;
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

export default function BitsyChat({ lesson, challenge, code, language }) {
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
    []
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
          className="bitsy-trigger"
          aria-label="Open Bitsy chat"
        >
          <span className="bitsy-trigger-avatar">
            <img src={bitsyDefault} alt="Bitsy" />
          </span>
          <span className="bitsy-trigger-text">
            <span className="bitsy-name">Bitsy</span>
            <span className="bitsy-hint">Ask me how to build this page</span>
          </span>
          <span className="bitsy-trigger-icon">
            <MessageCircle size={15} />
          </span>
        </button>
      ) : (
        <div className="bitsy-chat-card">
          <div className="bitsy-chat-header">
            <div className="bitsy-header-avatar">
              <img src={bitsyDefault} alt="Bitsy avatar" />
            </div>
            <div className="bitsy-header-info">
              <p className="bitsy-header-name">Bitsy</p>
              <p className="bitsy-header-subtitle">
                Your coding buddy is here to talk through the lesson.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bitsy-close-btn"
              aria-label="Close Bitsy chat"
            >
              <X size={16} />
            </button>
          </div>

          <div className="bitsy-messages">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`bitsy-message-row ${message.role}`}
              >
                {message.role === "bitsy" && (
                  <div className="bitsy-message-avatar">
                    <img src={bitsyDefault} alt="Bitsy" />
                  </div>
                )}

                <div className={`bitsy-message-bubble ${message.role}`}>
                  {message.role === "user" ? (
                    <p className="bitsy-message-text">{message.text}</p>
                  ) : (
                    <div
                      className="bitsy-message-markdown"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(message.text),
                      }}
                    />
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="bitsy-message-row bitsy">
                <div className="bitsy-message-avatar">
                  <img src={bitsyDefault} alt="Bitsy" />
                </div>
                <div className="bitsy-thinking">Bitsy is thinking...</div>
              </div>
            )}
          </div>

          <div className="bitsy-footer">
            <form
              className="bitsy-form"
              onSubmit={(event) => {
                event.preventDefault();
                sendPrompt(prompt);
              }}
            >
              <input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ask Bitsy something..."
                className="bitsy-input"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || isThinking}
                className="bitsy-send-btn"
              >
                <Send size={14} />
                Ask
              </button>
            </form>

            <div className="bitsy-quick-pills">
              {quickPrompts.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => sendPrompt(item)}
                  className="bitsy-pill"
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
