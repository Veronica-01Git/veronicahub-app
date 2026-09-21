# Veronica Members

Routes: `/membros` and `/admin/membros`. Additive React/TanStack implementation using the existing Neon/Drizzle database, sealed session, email OTP and admin authorization. Every verified Hub account is a free member; no checkout or financial tables are used.

Before deployment, apply `drizzle/0012_member_community.sql` to the same database as the application. This migration creates only the new content and moderation tables/indexes and can be run again safely. No runtime DDL and no changes to existing tables. This repository also has standalone SQL migrations; this file is deliberately standalone, not a generated Drizzle snapshot.

Admin can create/edit drafts, publish, return content to draft and approve/reject pending comments. Members can read published posts, copy prompts and submit moderated comments. The first feed is honestly empty until an administrator publishes. No fabricated members, engagement or announcements.

Images/videos use direct URLs from existing generated assets or the Hub media library. This module does not generate new AI media or upload files. Asset URLs inherit their storage permissions: publication content is session-gated, but an already-public media URL is not a private download. Use private storage/signed delivery if confidential media is required.

Verification: unauthenticated feed returns no posts; non-admin cannot write; drafts are absent from member queries; comments are shown only after approval and only for published posts. All rendering uses escaped React text. CSS is scoped, responsive and honors reduced motion.
