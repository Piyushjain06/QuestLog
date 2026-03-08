import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileClient } from "./ProfileClient";

export const metadata = {
    title: "My Profile — QuestLog",
    description: "View your gaming profile, stats, and library.",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/auth");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            library: {
                include: {
                    game: {
                        include: {
                            genres: { include: { genre: true } },
                            platforms: { include: { platform: true } },
                        }
                    }
                },
                orderBy: { updatedAt: "desc" },
            },
        },
    });

    if (!user) {
        redirect("/auth");
    }

    // Fetch accepted friends
    const friendships = await prisma.friendship.findMany({
        where: {
            status: "ACCEPTED",
            OR: [
                { senderId: user.id },
                { receiverId: user.id },
            ],
        },
        include: {
            sender: { select: { id: true, name: true, image: true } },
            receiver: { select: { id: true, name: true, image: true } },
        },
    });

    const friends = friendships.map((f) =>
        f.senderId === user.id ? f.receiver : f.sender
    );

    const library = user.library ?? [];

    const mappedLibrary = library.map((entry: any) => ({
        ...entry,
        game: {
            ...entry.game,
            genres: JSON.stringify(entry.game.genres?.map((g: any) => g.genre.name) || []),
            platforms: JSON.stringify(entry.game.platforms?.map((p: any) => p.platform.name) || []),
            tags: JSON.stringify([]),
        }
    }));

    return (
        <ProfileClient
            user={{
                name: user.name || user.email?.split("@")[0] || "Gamer",
                email: user.email || "",
                joinedAt: user.createdAt.toISOString(),
                image: user.image || null,
                bio: user.bio || "",
                trackerPlatform: (user as any).trackerPlatform || null,
                trackerUsername: (user as any).trackerUsername || null,
            }}
            library={JSON.parse(JSON.stringify(mappedLibrary))}
            friends={friends.map((f) => ({
                id: f.id,
                name: f.name,
                image: f.image,
            }))}
        />
    );
}

