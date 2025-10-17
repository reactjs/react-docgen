import Image from 'next/image';

interface Props {
  user: {
    name: string;
    logo: string;
    url: string;
  };
}

export default function User({ user }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const logo = require(`./logos/${user.logo}`);

  return (
    <div className="box-border w-full px-4 md:w-1/3">
      <a
        href={user.url}
        rel="noopener noreferrer"
        target="_blank"
        className="relative my-3.5 block h-32 rounded-md bg-white px-2.5 hover:scale-105 hover:shadow-md dark:bg-gray-50/10 md:hover:scale-110"
      >
        <Image
          src={logo}
          alt={user.name}
          className="absolute left-1/2 top-1/2 max-h-[100px] w-[128px] max-w-[200px] -translate-x-1/2 -translate-y-1/2"
        />
      </a>
    </div>
  );
}
