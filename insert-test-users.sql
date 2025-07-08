INSERT INTO users (
  email,
  password,
  "googleId",
  access_token,
  status,
  roles,
  fk_created_by,
  created_at,
  name
) VALUES (
 'admin@test.com',
 '$2a$10$XRuGhmBoJgTT5ab28Dilq.WxPskY7yPI4qsMWrdiLpD.koU4f9URa',
 '112784055456984002551',
 '',
 'active',
 ARRAY['admin'],
 1,
 '2023-01-18T19:44:58-5.00',
 'Test Admin'
), (
 'projectmanager@test.com',
 '$2a$10$zCjgq4m30ID5KS8AIFRj1ODTxabcW2XWnrrx2Fia2/HjzMhqX.oyG',
 '116600054352122723340',
 '',
 'active',
 ARRAY['productManager'],
 1,
 '2023-01-18T19:44:58-5.00',
 'Test Project Manager'
), (
 'editor@test.com',
 '$2a$10$zCjgq4m30ID5KS8AIFRj1ODTxabcW2XWnrrx2Fia2/HjzMhqX.oyG',
 '116600054352122723341',
 '',
 'active',
 ARRAY['editor'],
 1,
 '2023-01-18T19:44:58-5.00',
 'Test Editor'
), (
 'author@test.com',
 '$2a$10$zCjgq4m30ID5KS8AIFRj1ODTxabcW2XWnrrx2Fia2/HjzMhqX.oyG',
 '116600054352122723342',
 '',
 'active',
 ARRAY['author'],
 1,
 '2023-01-18T19:44:58-5.00',
 'Test Author'
)
