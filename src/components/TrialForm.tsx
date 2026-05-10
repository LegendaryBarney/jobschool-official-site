import { useState } from 'react';

type FormState = {
  name: string;
  phone: string;
  school: string;
  grade: string;
  subject: string;
  preferredTime: string;
  notes: string;
};

const initialState: FormState = {
  name: '',
  phone: '',
  school: '',
  grade: '',
  subject: '',
  preferredTime: '',
  notes: '',
};

const grades = ['國一', '國二', '國三', '高一', '高二', '高三'];
const subjects = ['數學', '物理', '化學', '生物', '理化', '英文', '英文作文', '社會'];

export default function TrialForm() {
  const [data, setData] = useState<FormState>(initialState);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    setError(null);

    try {
      // Phase 4 將串接 /api/trial endpoint（Resend + Turnstile + Vercel KV）
      await new Promise((resolve) => setTimeout(resolve, 600));
      setStatus('success');
      setData(initialState);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : '送出失敗，請稍後再試');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-xl bg-chalk border border-cream p-6 text-center">
        <h3 className="font-serif text-2xl font-bold text-charcoal">已收到您的試聽申請</h3>
        <p className="mt-3 text-charcoal/80">
          我們將於 1 個工作日內聯絡您，確認試聽時段。
        </p>
        <a
          href={import.meta.env.PUBLIC_LINE_URL || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-caramel px-6 font-medium text-charcoal"
        >
          加 LINE 領取詳細資訊
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="姓名" required>
          <input
            type="text"
            required
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            className="form-input"
          />
        </Field>
        <Field label="電話" required>
          <input
            type="tel"
            required
            pattern="09\d{8}"
            placeholder="09xxxxxxxx"
            value={data.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="form-input"
          />
        </Field>
        <Field label="就讀學校">
          <input
            type="text"
            value={data.school}
            onChange={(e) => update('school', e.target.value)}
            className="form-input"
          />
        </Field>
        <Field label="年級" required>
          <select
            required
            value={data.grade}
            onChange={(e) => update('grade', e.target.value)}
            className="form-input"
          >
            <option value="">請選擇</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
        <Field label="想諮詢的科目" required>
          <select
            required
            value={data.subject}
            onChange={(e) => update('subject', e.target.value)}
            className="form-input"
          >
            <option value="">請選擇</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="希望試聽時段">
          <input
            type="text"
            placeholder="如：平日晚上 / 週六下午"
            value={data.preferredTime}
            onChange={(e) => update('preferredTime', e.target.value)}
            className="form-input"
          />
        </Field>
      </div>

      <Field label="備註">
        <textarea
          rows={3}
          value={data.notes}
          onChange={(e) => update('notes', e.target.value)}
          className="form-input"
        />
      </Field>

      {error && <p className="text-sm text-sienna">{error}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex h-12 w-full md:w-auto items-center justify-center rounded-lg bg-caramel px-8 font-medium text-charcoal transition-all hover:-translate-y-px disabled:opacity-60"
      >
        {status === 'submitting' ? '送出中…' : '送出試聽申請'}
      </button>

      <style>{`
        .form-input {
          width: 100%;
          height: 2.75rem;
          padding: 0 0.75rem;
          border: 1px solid var(--color-cream);
          border-radius: 0.375rem;
          background-color: var(--color-chalk);
          color: var(--color-charcoal);
          font-size: 0.95rem;
          transition: border-color 200ms var(--ease-brand);
        }
        textarea.form-input { height: auto; padding: 0.6rem 0.75rem; }
        .form-input:focus {
          outline: none;
          border-color: var(--color-caramel);
          box-shadow: 0 0 0 3px rgba(200, 161, 101, 0.2);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-charcoal mb-1.5">
        {label}
        {required && <span className="text-sienna ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
