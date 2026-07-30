/**
 * 管理员密码哈希生成脚本
 * 使用方式：npx tsx scripts/hash-password.ts
 *
 * 运行后输入密码，脚本会输出 bcrypt 哈希值
 * 将哈希值填入 .env.local 的 ADMIN_PASSWORD_HASH
 */

import { hash } from 'bcrypt-ts';
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  const password = await rl.question('请输入管理员密码: ');
  const confirm = await rl.question('再次输入密码确认: ');

  if (password !== confirm) {
    console.error('❌ 两次输入的密码不一致');
    rl.close();
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ 密码长度至少为 6 个字符');
    rl.close();
    process.exit(1);
  }

  console.log('\n⏳ 正在生成密码哈希...');
  const hashed = await hash(password, 10);
  console.log('\n✅ 密码哈希生成成功！');
  console.log('\n请将以下内容复制到 .env.local 文件中：');
  console.log('\n---');
  console.log(`ADMIN_PASSWORD_HASH=${hashed}`);
  console.log('---\n');

  rl.close();
}

main().catch(console.error);
