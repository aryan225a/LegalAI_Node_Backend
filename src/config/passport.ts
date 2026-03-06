import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import prisma from './database.js';

const JWT_SECRET = process.env.JWT_SECRET!;

passport.use(
  'jwt-citizen',
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    },
    async (payload, done) => {
      try {
        if (payload.userType !== 'CITIZEN') return done(null, false);

        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { id: true, email: true, name: true, avatar: true, provider: true },
        });

        return user ? done(null, user) : done(null, false);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.use(
  'jwt-lawyer',
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    },
    async (payload, done) => {
      try {
        if (payload.userType !== 'LAWYER') return done(null, false);
        if (!payload.twoFactorVerified) return done(null, false);

        const lawyer = await prisma.lawyerUser.findUnique({
          where: { id: payload.sub },
          select: {
            id: true, email: true, name: true,
            verificationStatus: true, isLocked: true,
          },
        });

        if (!lawyer || lawyer.isLocked) return done(null, false);
        return done(null, { ...lawyer, userType: 'LAWYER' });
      } catch (error) {
        return done(error, false);
      }
    }
  )
);


passport.use(
  'jwt-firm',
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    },
    async (payload, done) => {
      try {
        if (payload.userType !== 'FIRM_ADMIN') return done(null, false);
        if (!payload.twoFactorVerified) return done(null, false);

        const firm = await prisma.firmUser.findUnique({
          where: { id: payload.sub },
          select: {
            id: true, email: true, name: true, firmName: true,
            verificationStatus: true, isLocked: true,
          },
        });

        if (!firm || firm.isLocked) return done(null, false);
        return done(null, { ...firm, userType: 'FIRM_ADMIN' });
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export default passport;