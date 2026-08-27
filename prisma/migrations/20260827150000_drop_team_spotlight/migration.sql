-- DropTable
-- "Команда в деле" feature removed, replaced on the home page by a carousel
-- of real news posts (FeaturedNewsCarousel). This permanently deletes any
-- saved team-spotlight photos/captions - the uploaded image files themselves
-- are left in public/uploads (harmless, just orphaned).
DROP TABLE "TeamSpotlight";
