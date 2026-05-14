-- Optional display fields for workspace list / project cards (UI).
ALTER TABLE project
    ADD COLUMN banner_image_url VARCHAR(500),
    ADD COLUMN budget_label VARCHAR(50),
    ADD COLUMN card_due_date DATE;
