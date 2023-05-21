import Image from 'next/image';

interface Props {
  user: {
    name: string;
    logo: string;
    url: string;
  };
}

export default ({ user }: Props) => (
  <div className="box-border w-1/3 px-4">
    <a
      href={user.url}
      target="_blank"
      className="relative my-3.5 block h-32 rounded-md bg-white px-2.5 hover:scale-110 hover:shadow-md"
    >
      <Image
        src={require(`./logos/${user.logo}`)}
        alt={user.name}
        className="absolute left-1/2 top-1/2 max-h-[100px] w-[128px] max-w-[200px] -translate-x-1/2 -translate-y-1/2"
      />
    </a>
  </div>
);
