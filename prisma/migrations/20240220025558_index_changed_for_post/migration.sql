-- DropIndex
DROP INDEX "Post_content_idx";

-- CreateIndex
CREATE INDEX "Post_heading_idx" ON "Post"("heading");
