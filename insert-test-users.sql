INSERT INTO users (
  email,
  password,
  "googleId",
  access_token,
  status,
  roles,
  fk_created_by,
  created_at
) VALUES (
 'admin@frontedgepublishing.com',
 '$2a$10$XRuGhmBoJgTT5ab28Dilq.WxPskY7yPI4qsMWrdiLpD.koU4f9URa',
 '112784055456984002551',
 '',
 'active',
 ARRAY['admin'],
 1,
 '2023-01-18T19:44:58-5.00'
), (
 'john.hile@frontedgepublishing.com',
 '$2a$10$zCjgq4m30ID5KS8AIFRj1ODTxabcW2XWnrrx2Fia2/HjzMhqX.oyG',
 '116600054352122723340',
 '',
 'active',
 ARRAY['admin'],
 1,
 '2023-01-18T19:44:58-5.00'
), (
 'dmitri.barvinok@frontedgepublishing.com',
 '$2a$10$bNeGlQ0yc7X3qGPF3IduUOPyjt7/F.cuWxzmx3eimZupKAXw4V47a',
 '',
 '',
 'active',
 ARRAY['admin'],
 1,
 '2023-06-26T19:44:58-5.00'
), (
  'david.crumm@frontedgepublishing.com',
  '$2a$10$NjK.7gDCQG.MFOtFRFA9f.1D/b9AEjBc1osmBZdv7f7APvFmhLd7C',
  '',
  '',
  'active',
  ARRAY['admin'],
  1,
  '2023-06-26T19:44:58-5.00'
), (
  'susan.stitt@frontedgepublishing.com',
  '$2a$10$D4ThQV4Xpu/5ijqgSs.LXuj3E4/L1o1WX23MnX3VbpGKttM8uBXLS',
  '',
  '',
  'active',
  ARRAY['admin'],
  1,
  '2023-06-26T19:44:58-5.00'
), (
  'patty.thompson@frontedgepublishing.com',
  '$2a$10$OeL3bU0tb8DMleFf730Rzu5DtpgWHpcQQHObJUTz7OtSrWr0FESvi',
  '',
  '',
  'active',
  ARRAY['admin'],
  1,
  '2023-06-26T19:44:58-5.00'
)
