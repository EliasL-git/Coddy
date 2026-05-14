import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { CheckCircle2, XCircle, Lightbulb, ArrowRight, RotateCcw, Trophy, Zap } from 'lucide-react';

export default function LessonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [newAchievements, setNewAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.lessons.get(id);
        setLesson(data);
        const first = data.challenges?.[0];
        if (first) setCode(first.starterCode || '');
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const challenge = lesson?.challenges?.[currentIdx];

  function normalize(str) {
    return str
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\s*([\{\}\(\)\[\];:,])'\s*/g, '$1')
      .trim();
  }

  function checkAnswer() {
    if (!challenge) return;
    const userNorm = normalize(code);
    const expectedNorm = normalize(challenge.expectedOutput);

    // Simple substring check for flexibility
    const ok = userNorm.includes(expectedNorm) || expectedNorm.includes(userNorm);

    if (ok) {
      setFeedback({ type: 'success', message: "Great job! That's correct. 🎉" });
    } else {
      setFeedback({ type: 'error', message: 'Not quite. Check your syntax and try again.' });
    }
  }

  function nextChallenge() {
    if (currentIdx + 1 < (lesson?.challenges?.length || 0)) {
      const next = lesson.challenges[currentIdx + 1];
      setCurrentIdx(currentIdx + 1);
      setCode(next.starterCode || '');
      setFeedback(null);
      setHintsOpen(false);
    } else {
      finishLesson();
    }
  }

  async function finishLesson() {
    try {
      const data = await api.lessons.complete(lesson.id);
      updateUser({
        xp: data.xp,
        streak: data.streak,
        completedLessons: data.completedLessons,
        achievements: data.achievements,
      });
      setNewAchievements(data.newAchievements || []);
      setCompleted(true);
    } catch {
      // proceed anyway
      setCompleted(true);
    }
  }

  function resetChallenge() {
    if (challenge) setCode(challenge.starterCode || '');
    setFeedback(null);
    setHintsOpen(false);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-muted">Loading lesson...</div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-muted">Lesson not found.</div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-surface rounded-2xl border border-border p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} />
          </div>
          <h2 className="text-2xl font-extrabold mb-2">Lesson Complete! 🎉</h2>
          <p className="text-muted mb-4">You earned {lesson.xpReward} XP</p>

          {newAchievements.length > 0 && (
            <div className="mb-6">
              <p className="font-bold text-sm mb-2">New Achievements</p>
              <div className="flex flex-wrap justify-center gap-2">
                {newAchievements.map((a) => (
                  <div key={a.id} className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 text-sm">
                    <span className="mr-1">{a.icon}</span>
                    <span className="font-semibold">{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <Link
              to={`/learn/${lesson.language}`}
              className="bg-background hover:bg-border text-foreground font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              Back to Lessons
            </Link>
            <Link
              to="/"
              className="bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link to={`/learn/${lesson.language}`} className="text-sm text-muted hover:text-foreground">
          ← Back to {lesson.language === 'html' ? 'HTML' : lesson.language === 'css' ? 'CSS' : 'JavaScript'}
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <h1 className="text-xl font-extrabold">{lesson.title}</h1>
          <span className="text-xs text-muted">Challenge {currentIdx + 1} of {lesson.challenges.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface rounded-2xl border border-border p-5">
          <h3 className="font-bold mb-2">{challenge?.title}</h3>
          <p className="text-sm text-muted mb-4">{challenge?.description}</p>
          <div className="bg-background rounded-xl p-3 text-sm border border-border mb-4">
            <strong>Instructions:</strong> {' '}
            {challenge?.instructions}
          </div>

          <button
            onClick={() => setHintsOpen(!hintsOpen)}
            className="flex items-center gap-1.5 text-sm text-secondary font-medium mb-1"
          >
            <Lightbulb size={16} />
            {hintsOpen ? 'Hide hints' : 'Show hints'}
          </button>
          {hintsOpen && (
            <ul className="text-sm text-muted list-disc list-inside space-y-1">
              {challenge?.hints?.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-surface rounded-2xl border border-border p-5 flex flex-col">
          <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Code Editor</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 min-h-[200px] w-full bg-gray-900 text-green-400 font-mono text-sm rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={resetChallenge}
              className="flex items-center gap-1 bg-background hover:bg-border text-sm font-medium px-3 py-2 rounded-xl transition-colors"
            >
              <RotateCcw size={14} /> Reset
            </button>
            {!feedback ? (
              <button
                onClick={checkAnswer}
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl transition-colors"
              >
                Check
              </button>
            ) : feedback.type === 'success' ? (
              <button
                onClick={nextChallenge}
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={() => setFeedback(null)}
                className="flex-1 bg-wrong hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`mt-4 rounded-2xl border p-4 flex items-start gap-3 ${
            feedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-wrong-light border-red-200 text-wrong'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          <div>
            <p className="font-bold">{feedback.type === 'success' ? 'Correct!' : 'Incorrect'}</p>
            <p className="text-sm">{feedback.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
