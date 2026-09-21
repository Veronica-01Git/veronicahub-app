CREATE TABLE IF NOT EXISTS "MemberPost" (
 "id" text PRIMARY KEY, "title" text NOT NULL, "body" text NOT NULL,
 "kind" text NOT NULL CHECK (kind IN ('novidade','prompt','ideia','imagem','video')),
 "prompt" text NOT NULL DEFAULT '', "mediaUrl" text NOT NULL DEFAULT '',
 "status" text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
 "authorId" text NOT NULL REFERENCES "User"(id), "createdAt" timestamp NOT NULL DEFAULT now(), "publishedAt" timestamp
);
CREATE INDEX IF NOT EXISTS "MemberPost_status_published_idx" ON "MemberPost" (status,"publishedAt");
CREATE TABLE IF NOT EXISTS "MemberComment" (
 "id" text PRIMARY KEY, "postId" text NOT NULL REFERENCES "MemberPost"(id) ON DELETE CASCADE,
 "userId" text NOT NULL REFERENCES "User"(id), "name" text NOT NULL, "body" text NOT NULL,
 "status" text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
 "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "MemberComment_post_status_idx" ON "MemberComment" ("postId",status);
CREATE INDEX IF NOT EXISTS "MemberComment_user_created_idx" ON "MemberComment" ("userId","createdAt");

CREATE TABLE IF NOT EXISTS "MemberCommentCooldown" (
 "userId" text PRIMARY KEY REFERENCES "User"(id), "nextAllowedAt" timestamp NOT NULL
);
