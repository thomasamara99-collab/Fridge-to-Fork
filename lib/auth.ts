import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "./prisma";

export type AppSession = {
  user: {
    id: string;
  };
};

const ensureUser = async () => {
  const user = await currentUser();
  const userId = user?.id;
  if (!userId) return null;

  const email = (
    user.emailAddresses?.[0]?.emailAddress ?? `${userId}@users.clerk`
  ).toLowerCase();
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username ||
    null;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      email,
      name,
      passwordHash: "clerk",
    },
  });
};

export const auth = async (): Promise<AppSession | null> => {
  const { userId } = clerkAuth();
  if (!userId) return null;

  const dbUser = await ensureUser();
  if (!dbUser) return null;

  return {
    user: {
      id: dbUser.id,
    },
  };
};
