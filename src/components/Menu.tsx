import {
  HomeIcon,
  ListBulletIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  AdjustmentsHorizontalIcon,
  CakeIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Menu() {
  return (
    <div className="fixed bottom-0 flex h-20 w-full items-center justify-between border-2 bg-stone-200 px-4">
      <MenuButton path="/records" text="交易紀錄" icon={ListBulletIcon} />
      <MenuButton path="/pay" text="預訂餐點" icon={CalendarDaysIcon} />
      <MenuButton
        path="/"
        text="首頁"
        icon={HomeIcon}
        mainIcon={BanknotesIcon}
      />
      <MenuButton path="/recharge" text="下午茶" icon={CakeIcon} />
      <MenuButton
        path="/staffRecords"
        text="設定"
        icon={AdjustmentsHorizontalIcon}
      />
    </div>
  );
}

export function MenuButton(props: {
  icon: React.FC<React.ComponentProps<"svg">>;
  text: string;
  path: string;
  mainIcon?: React.FC<React.ComponentProps<"svg">>;
}) {
  const router = useRouter();
  const isActive = router.pathname === props.path;
  const Icon = props.mainIcon && isActive ? props.mainIcon : props.icon;

  return (
    <Link href={props.path}>
      <div
        data-ui={[isActive && "active", props.mainIcon && "main"].join(" ")}
        className="group p-3 data-main:rounded-full data-main:shadow-lg data-active:data-main:bg-amber-500"
      >
        <Icon className="h-8 w-8 text-stone-400 group-data-active:text-amber-500 group-data-main:h-12 group-data-main:w-12 group-data-main:group-data-active:text-amber-100" />
      </div>
    </Link>
  );
}
