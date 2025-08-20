import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"

import NewOAuthService from "@/services/authentication/oauth-service"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
    })
  ],
  // 啟用 JWT
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes
  },
  callbacks: {

    async jwt({ token, user, account, trigger, session }) {

      // 增加對 logging_out 事件的處理
      if (trigger === 'signOut') {
        token.isLoggedOut = true;
        return token;
      }

      if (user?.backendToken) {
        token.backendToken = user.backendToken;
      }

      return token;
    },

    async session({ session, token }) {

      if (token?.backendToken) {
        session.backendToken = token.backendToken;
      }
      // 將登出狀態傳遞到 session
      session.isLoggedOut = token.isLoggedOut;

      return session;
    },



    async signIn({ user, account }) {
      if (account.provider === 'facebook') {
        return true;
      } else {
        try {
          if (account.id_token) {
            const res = await NewOAuthService.loginByGoogle(account.id_token);
            console.log("api/auth/[...nextauth]/route.js. signIn.")
            console.log("google login res: ", res.data);

            if (res?.data?.token) {
              user.backendToken = res.data.token;
              return true; // 保持為 true，讓 NextAuth 處理重導向
            }
          }
          return false;
        } catch (error) {
          if (error?.response?.data?.errorCode === "1062") {
            return `/login?message=account_deactivated`;
          }
          console.error('SignIn callback error:', error);
          return false;
        }
      }
    },

    async redirect({ url, baseUrl }) {
      // 成功登入後導向到 handle-login
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/auth/handle-login`;
      }
      return baseUrl;
    }, 

    async signOut() {
      // 確保在登出時清除所有相關的 token 和 session
      return true
    },
  },
  debug: true,
  events: {
    // 監聽事件
    async signIn({ user, account, profile }) {
      // 可以在這裡處理登入後的操作，例如寫入資料庫
      console.log("signIn: ", user, account, profile);
    },
    async signOut({ token }) {
      // 處理登出事件
    },
    async session({ session, token }) {
      // session 更新時觸發
    }
  }
})

export { handler as GET, handler as POST }