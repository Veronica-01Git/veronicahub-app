-- Novas editorias do Wire TV (27/09/2026).
--   sc       — Santa Catarina e IA, apurada nos portais catarinenses.
--   veronica — notícias da própria Veronica Hub (conteúdo da casa, fora do
--              rodízio automático).
-- ADD VALUE é aditivo: nenhuma matéria existente muda de editoria.
ALTER TYPE "ArticleBeat" ADD VALUE IF NOT EXISTS 'sc';
--> statement-breakpoint
ALTER TYPE "ArticleBeat" ADD VALUE IF NOT EXISTS 'veronica';
