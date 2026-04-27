import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

function allowedEmails() {
  return new Set(
    (process.env.AUTH_ALLOWED_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === 'string'
            ? credentials.email.trim().toLowerCase()
            : '';
        const password =
          typeof credentials?.password === 'string' ? credentials.password : '';
        const allowlist = allowedEmails();
        const adminPassword = process.env.AUTH_ADMIN_PASSWORD;

        if (!email || !password || !adminPassword) return null;
        if (allowlist.size === 0 || !allowlist.has(email)) return null;
        if (password !== adminPassword) return null;

        return {
          id: email,
          email,
          name: email,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth }) {
      const allowlist = allowedEmails();
      const email = auth?.user?.email?.toLowerCase();
      return Boolean(email && allowlist.has(email));
    },
  },
});
