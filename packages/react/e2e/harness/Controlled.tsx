import { useState } from "react";
import { Mention, useMention } from "@danielivanov/mention";
import { users, type User } from "./users.ts";

const config = {
  items: users,
  getKey: (u: User) => u.id,
  getLabel: (u: User) => u.username,
};
export function Controlled() {
  const [value, setValue] = useState("");
  const mention = useMention(config);
  return (
    <main>
      <h1>Consumer integrations</h1>
      <form>
        <Mention.Root {...config}>
          <Mention.Input
            aria-label="Controlled"
            name="message"
            value={value}
            onChange={(e) => setValue(e.currentTarget.value)}
          />
          <Mention.Popover aria-label="People">
            <Mention.List<User>>
              {(user) => (
                <Mention.Item value={user}>{user.username}</Mention.Item>
              )}
            </Mention.List>
          </Mention.Popover>
        </Mention.Root>
      </form>
      <output data-testid="controlled-value">{value}</output>
      <textarea {...mention.getInputProps({ "aria-label": "Standalone" })} />
      {mention.open && (
        <div {...mention.getPopoverProps()} aria-label="Standalone people">
          {mention.items.map((user, index) => (
            <div key={user.id} {...mention.getItemProps(user, index)}>
              {user.username}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
