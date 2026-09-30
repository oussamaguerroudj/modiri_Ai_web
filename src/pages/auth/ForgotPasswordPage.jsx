import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import AuthLayout from './AuthLayout.jsx';
import Input from '../../components/ui/Input.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import * as authApi from '../../api/auth';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(err.message || 'Could not send the reset code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={t('forgotPasswordTitle', 'Forgot your password?')}
      subtitle={t('forgotPasswordSubtitle', "We'll email you a code to reset it.")}
      footer={
        <Link to="/login" className="font-semibold text-brand-blue hover:underline">
          {t('backToLogin', 'Back to sign in')}
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Alert>{error}</Alert>
        <Input
          label={t('email', 'Email')}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
        />
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner size={18} /> : <Mail size={18} />}
          {t('sendResetCode', 'Send reset code')}
        </button>
      </form>
    </AuthLayout>
  );
}
