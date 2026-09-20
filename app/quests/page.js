'use client';
import { useEffect, useState } from 'react';
import { useBlip, post } from '../useBlip';
import Icon from '../Icons';
import { useT } from '../i18n';
import { T } from '@/lib/i18n.mjs';

function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const QUIZ_BANK = [
  {
    prompt: T('Which message is most likely a scam?'),
    options: [
      { label: T('Your E-ZPass balance is overdue. Pay $6.99 now at ezpass-tollpay.top to avoid a $50 fine.'), correct: true },
      { label: T('Your statement is ready. Open the app to view it.'), correct: false },
      { label: T('A charge from your grocery store was declined.'), correct: false },
    ],
  },
  {
    prompt: T('Which one should you treat as a scam?'),
    options: [
      { label: T('You are owed a $312 refund. Confirm your card number at bank-refund-secure.com within 24 hours.'), correct: true },
      { label: T('You have a scheduled payment due tomorrow.'), correct: false },
      { label: T('Your internet bill is ready to view in the app.'), correct: false },
    ],
  },
  {
    prompt: T('Which message looks safe?'),
    options: [
      { label: T('Your statement is ready. Open the app to view it.'), correct: true },
      { label: T('Urgent action needed: your card is locked. Click here now.'), correct: false },
      { label: T('Your account is suspended. Confirm your password immediately.'), correct: false },
    ],
  },
  {
    prompt: T('Which message is the safest to trust?'),
    options: [
      { label: T('A payment from your landlord is pending. Review details in the app you already use.'), correct: true },
      { label: T('Your account is locked. Click to verify your SSN now.'), correct: false },
      { label: T('Your package is delayed. Pay a small fee to unlock delivery.'), correct: false },
    ],
  },
  {
    prompt: T('Which request is most likely a scam?'),
    options: [
      { label: T('We sent a security code to your phone. Open the app to confirm the login yourself.'), correct: true },
      { label: T('The sender says they are your bank and asks you to share the code they just texted.'), correct: false },
      { label: T('You received a reminder that your bill is due this week.'), correct: false },
    ],
  },
  {
    prompt: T('What is the best response to a strange message?'),
    options: [
      { label: T('Ignore it and verify through the official app or number you already use.'), correct: true },
      { label: T('Click the link to check if it is real.'), correct: false },
      { label: T('Reply with personal details to stop it.'), correct: false },
    ],
  },
];

export default function Quests() {
  const t = useT();
  const { state, refresh } = useBlip();
  const [note, setNote] = useState('');
  const [answers, setAnswers] = useState({});
  const [awarded, setAwarded] = useState({});
  const [quizSet, setQuizSet] = useState([]);

  useEffect(() => {
    const shuffled = shuffleArray(QUIZ_BANK).slice(0, 3);
    setQuizSet(shuffled);
    setAnswers({});
  }, []);

  if (!state) return <p role="status">{t('Loading…')}</p>;

  const visiblePoints = state.points;
  const mainPoints = state.points;

  function handleQuizAnswer(questionIndex, option) {
    if (answers[questionIndex] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: option.label }));
    if (option.correct) {
      post('/api/events', { type: 'quiz_bonus' }).then((r) => {
        setAwarded((prev) => ({ ...prev, [questionIndex]: r.awarded > 0 }));
        refresh();
      });
    }
  }

  async function redeem() {
    const r = await post('/api/redeem');
    setNote(r.ok ? t('Demo gift card code: {code}', { code: r.code }) + ' (' + r.note + ')' : r.error);
    refresh();
  }

  return (
    <>
      <h1>{t('Quests')}</h1>
      <p className="sub">{t('Points come from real safe habits reported by your bank, never from spending or opening cards.')}</p>
      <div className="card">
        <h2>{t('{p} points · Level {l}', { p: mainPoints, l: state.level.index + 1 })} {t(state.level.name)}</h2>
        <div className="prog" role="progressbar" aria-label={t('Level progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.level.progress)}><div style={{ width: state.level.progress + '%' }} /></div>
        {state.quests.map((q) => (
          <div className={'q' + (q.done ? ' done' : '')} key={q.id}>
            <span><span className="tick"><Icon name="check" size={13} /></span>{t(q.title)} <span className="note">{t(q.category)}</span></span>
            <span className={'pill' + (q.done ? ' ok' : '')}>{q.done ? t('Done') : '+' + q.points}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <h2>{t('Earn extra points')}</h2>
        <p className="note" style={{ margin: '-4px 0 14px' }}>
          {state.quizBonus.leftToday > 0
            ? t('{left} of {cap} bonus answers left today (+{pts} each).', { left: state.quizBonus.leftToday, cap: state.quizBonus.dailyCap, pts: state.quizBonus.points })
            : t('You have used the quiz bonuses for today. You can still practice, and more unlock tomorrow.')}
        </p>
        <div className="quiz-list">
          {quizSet.length === 0 ? [] : quizSet.map((quiz, qIndex) => {
            const selectedAnswer = answers[qIndex];
            const correctChoice = quiz.options.find((option) => option.correct);
            const hasAnswered = typeof selectedAnswer === 'string';

            return (
              <div key={qIndex + '-' + quiz.prompt} className="quiz-block">
                <p className="quiz-prompt">{t(quiz.prompt)}</p>
                <div className="quiz-options">
                  {quiz.options.map((option, optionIndex) => {
                    const isCorrect = option.correct;
                    const isSelected = selectedAnswer === option.label;
                    const showCorrectBonus = hasAnswered && isCorrect && isSelected;
                    const isWrongSelected = hasAnswered && isSelected && !isCorrect;
                    const className = [
                      'ghost',
                      'quiz-option',
                      isWrongSelected ? 'wrong' : '',
                      isCorrect && (hasAnswered || isSelected) ? 'correct' : '',
                    ].filter(Boolean).join(' ');

                    return (
                      <button
                        key={optionIndex + '-' + option.label}
                        className={className}
                        onClick={() => handleQuizAnswer(qIndex, option)}
                      >
                        <span>{t(option.label)}</span>
                        {showCorrectBonus && awarded[qIndex] === true && <span className="quiz-points">+{state.quizBonus.points}</span>}
                        {showCorrectBonus && awarded[qIndex] === false && <span className="quiz-points capped">{t('Limit reached')}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="card">
        <h2>{t('Rewards')}</h2>
        <p className="note">{t('$5 gift card costs {n} points. Demo only.', { n: state.redeemCost })}</p>
        <button onClick={redeem}>{t('Redeem $5 gift card')}</button> {note && <span className="note" role="status">{note}</span>}
      </div>
      <p className="note">{t('Quests complete when the bank sends an event. Use the Bank simulator tab to fire them.')}</p>
    </>
  );
}
