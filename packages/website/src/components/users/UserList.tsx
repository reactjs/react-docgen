import User from './User';
import users from './users.json';

interface Props {
  category: string;
}

export default ({ category: filterCategory }: Props) => (
  <div className="flex flex-row flex-wrap items-center justify-center rounded-md bg-gray-300 px-7 py-5">
    {users
      .filter(({ category }) => category === filterCategory)
      .map((user) => (
        <User user={user} key={user.name} />
      ))}
  </div>
);
