const BIN_ID     = '69f31bf4aaba882197556e92';
const ACCESS_KEY = '$2a$10$bC.x0kcg6YXik32STxh46eVPotxbT4crJZk52XLnrHA5i7kkt1RbC';
const BIN_URL    = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const HEADERS_R  = { 'X-Access-Key': ACCESS_KEY, 'X-Bin-Meta': 'false' };
const HEADERS_W  = { 'X-Access-Key': ACCESS_KEY, 'Content-Type': 'application/json' };
const PWD_KEY    = 'lexiprof_admin_pwd';
const DEFAULT_PW = 'admin123';