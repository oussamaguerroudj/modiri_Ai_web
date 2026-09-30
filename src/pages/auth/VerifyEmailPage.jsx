import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import AuthLayout from './AuthLayout.jsx';
import Input from '../../components/ui/Input.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import * as authApi from '../../api/auth';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { completeVerification } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const result = await authApi.verifyEmail({ email, code });
      await completeVerification(result);
      navigate('/onboarding/business-type', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setInfo('');
    setResending(true);
    try {
      await authApi.resendVerification({ email });
      setInfo(t('verifyCodeResent', 'A new code has been sent to your email.'));
    } catch (err) {
      setError(err.message || 'Could not resend the code.');
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout
      title={t('verifyAccountTitle', 'Verify your email')}
      subtitle={t('verifyAccountSubtitle', 'Enter the 6-digit code we sent to your inbox.').replace('{email}', email)}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Alert>{error}</Alert>
        <Alert tone="success">{info}</Alert>
        <Input
          label={t('email', 'Email')}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
        />
        <Input
          label={t('verifyCodeLabel', 'Verification code')}
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="123456"
          className="tracking-[0.5em] text-center text-lg"
        />
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner size={18} /> : <ShieldCheck size={18} />}
          {t('verifyAccountButton', 'Verify')}
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || !email}
          className="btn-ghost w-full"
        >
          {resending ? <Spinner size={16} /> : null}
          {t('verifyResendCode', 'Resend code')}
        </button>
      </form>
    </AuthLayout>
  );
}
