# BookEdge Server release notes

## 15.0
* Fix mentions DataResolver to add created_at and fk_create_by
* Html editor fields now show when another changes them
* Saving edited pages are a bit faster
* Added multi-user conflict detection and resolution
* Removed review-quotes service and table (migrated to amazon_review_quotes field in books table)

## 14.0
* Add priority property to endorsement
* Add short_biography, amazon_biography and one_line_biography to contributor
* project_property to books-history

## 13.0
* Add 'duplicate' as status setting for release
* Add marketing and supplementary notes
* Add 'jwt expired' to log infos
* Add 'pending' to allowed release status values
* Reset file_storage_id in user record if if gdrive validation fails

## 12.0

* Update book when issue count changes
* fix some "can't read property of undefined" bugs
* change NotAuthenticated and token expired log error to log infos
* update shell scripts

## 11.0
* Add file_storage_service (unfinished)
* Add hook to initialize file_storage_service on authentication
* update to latest eslint (version 9+)
* Add bluesky and threads to contributors
* Add base_print_cost and full_duplex_cover fields to releases
* Expand fep_share fields in books for both paperback and hard cover
