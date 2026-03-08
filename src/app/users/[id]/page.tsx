import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PublicProfileClient } from "./PublicProfileClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
    const user = await prisma.user.findUnique({
        where: { id: params.id },
        select: { name: true },
    });
    return {
        title: user ? `${user.name}'s Profile — QuestLog` : "Profile — QuestLog",
        description: user ? `View ${user.name}'s gaming profile on QuestLog.` : "View this gamer's profile.",
    };
}

export default async function UserProfilePage({
    params,
}: {
    params: { id: string };
}) {
    const user = await prisma.user.findUnique({
        where: { id: params.id },
        select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            createdAt: true,
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
        notFound();
    }

    // Check friendship status with current user
    let friendshipStatus: string | null = null;
    let friendshipId: string | null = null;

    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (currentUser && currentUser.id !== user.id) {
            const friendship = await prisma.friendship.findFirst({
                where: {
                    OR: [
                        { senderId: currentUser.id, receiverId: user.id },
                        { senderId: user.id, receiverId: currentUser.id },
                    ],
                },
            });
            if (friendship) {
                friendshipStatus = friendship.status;
                friendshipId = friendship.id;
            }
        }
    }

    const mappedLibrary = user.library.map((entry: any) => ({
        ...entry,
        game: {
            ...entry.game,
            genres: JSON.stringify(entry.game.genres?.map((g: any) => g.genre.name) || []),
            platforms: JSON.stringify(entry.game.platforms?.map((p: any) => p.platform.name) || []),
            tags: JSON.stringify([]),
        }
    }));

    return (
        <PublicProfileClient
            userId={user.id}
            initialUser={{
                id: user.id,
                name: user.name || "Gamer",
                image: user.image,
                bio: user.bio || "",
                joinedAt: user.createdAt.toISOString(),
            }}
            initialLibrary={JSON.parse(JSON.stringify(mappedLibrary))}
            initialFriendshipStatus={friendshipStatus}
            initialFriendshipId={friendshipId}
        />
    );
}
