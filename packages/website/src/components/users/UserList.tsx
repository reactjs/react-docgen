import User from './User';
import users from './users.json';

interface Props {
  category: string;
}

export default function UserList({ category: filterCategory }: Props) {
  return (
    <div className="mt-3 flex flex-row flex-wrap items-center justify-center rounded-md bg-gray-300 px-7 py-5 dark:bg-gray-50/10">
      {users
        .filter(({ category }) => category === filterCategory)
        .map((user) => (
          <User user={user} key={user.name} />
        ))}
    </div>
  );
}
