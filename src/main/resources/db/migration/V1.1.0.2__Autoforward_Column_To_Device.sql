
-- Default the StudyKey to NULL.  Indicates no study has been associated with this query
ALTER TABLE DEVICE add column IsAutoforward int not null with default 0;
