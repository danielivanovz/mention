// Same dataset as the spike's prototype harness — keeps the e2e tests
// directly comparable across the Option-A (Ariakit) prototype and the
// real lib. Filtering tests assume "@al" narrows to alice (substring
// match on `username`), and "@" alone yields ≥ several options.
export interface User {
  readonly id: string;
  readonly username: string;
  readonly name: string;
}

export const users: readonly User[] = [
  { id: "u1", username: "alice", name: "Alice Anderson" },
  { id: "u2", username: "bob", name: "Bob Brennan" },
  { id: "u3", username: "carol", name: "Carol Chen" },
  { id: "u4", username: "dave", name: "Dave Davies" },
  { id: "u5", username: "eve", name: "Eve Edwards" },
  { id: "u6", username: "frank", name: "Frank Fischer" },
  { id: "u7", username: "grace", name: "Grace Garcia" },
  { id: "u8", username: "heidi", name: "Heidi Hassan" },
  { id: "u9", username: "ivan", name: "Ivan Ivanov" },
  { id: "u10", username: "judy", name: "Judy Johansson" },
  { id: "u11", username: "kevin", name: "Kevin Kim" },
  { id: "u12", username: "linda", name: "Linda Lopez" },
  { id: "u13", username: "mallory", name: "Mallory Moreau" },
  { id: "u14", username: "niaj", name: "Niaj Nakamura" },
  { id: "u15", username: "olivia", name: "Olivia O'Brien" },
  { id: "u16", username: "peggy", name: "Peggy Petersson" },
  { id: "u17", username: "quentin", name: "Quentin Quinn" },
  { id: "u18", username: "rupert", name: "Rupert Ramirez" },
  { id: "u19", username: "sybil", name: "Sybil Singh" },
  { id: "u20", username: "trent", name: "Trent Tanaka" },
];

// IME smoke dataset (M8). Mixed Latin + CJK labels so candidate-window
// selection lands on observably-different items per IME — Japanese (kana
// → kanji), Pinyin (Latin → 汉字), Gboard (gesture + autocomplete).
// Same `User` shape so the harness swap is dataset-only, no code branch
// downstream of the channel config.
export const imeUsers: readonly User[] = [
  { id: "i1", username: "alice", name: "Alice Anderson" },
  { id: "i2", username: "tanaka", name: "田中花子" },
  { id: "i3", username: "wang", name: "王伟" },
  { id: "i4", username: "bob", name: "Bob Brennan" },
  { id: "i5", username: "suzuki", name: "鈴木一郎" },
  { id: "i6", username: "li", name: "李娜" },
  { id: "i7", username: "charlie", name: "Charlie Chen" },
  { id: "i8", username: "yamada", name: "山田太郎" },
];
