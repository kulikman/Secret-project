import Image from "next/image";
import Link from "next/link";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";

import { ROUTES } from "@/lib/constants";

const cormorant = Cormorant_Garamond({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const ebGaramond = EB_Garamond({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const objects = [
  {
    alt: "Манускрипт на рабочем столе",
    caption: "Войти в Бюро",
    href: ROUTES.dashboard,
    image: "/home/manuscript.png",
    nodes: false,
    position: "left-[26%] top-[55%]",
    size: "w-[min(25vw,360px)]",
  },
  {
    alt: "Карта связей на рабочем столе",
    caption: "Открыть Карту",
    href: ROUTES.awakeningMap,
    image: "/home/map.png",
    nodes: true,
    position: "left-[51%] top-[51%]",
    size: "w-[min(27vw,392px)]",
  },
  {
    alt: "Папки архива на рабочем столе",
    caption: "Изучить Архив",
    href: "/topics",
    image: "/home/folders.png",
    nodes: false,
    position: "left-[75%] top-[56%]",
    size: "w-[min(24vw,338px)]",
  },
] as const;

const mapNodes = [
  ["30%", "34%", "0s", "size-2.5"],
  ["44%", "44%", ".5s", "size-2"],
  ["58%", "36%", "1s", "size-2"],
  ["66%", "50%", "1.5s", "size-2.5"],
  ["40%", "56%", "2s", "size-2"],
  ["54%", "60%", "2.6s", "size-2"],
  ["72%", "42%", "1.2s", "size-2"],
] as const;

const dustMotes = Array.from({ length: 14 }, (_, index) => {
  const left = 26 + ((index * 53) % 48);
  const top = 56 + ((index * 17) % 34);
  const duration = 11 + (index % 6) * 2.2;
  const delay = (index * 0.8).toFixed(1);
  const dx = (index % 2 ? 1 : -1) * (12 + ((index * 7) % 30));
  const size = index % 3 === 0 ? "size-[2.6px]" : "size-[1.8px]";

  return { delay, duration, dx, left, size, top };
});

export default function Home(): React.ReactElement {
  return (
    <section
      className={`${cormorant.className} relative isolate min-h-svh overflow-hidden bg-[#050403] text-[#ecd6a6]`}
    >
      <style>{`
        @keyframes bureauLampBreathe {
          0%, 100% { opacity: .85; }
          50% { opacity: 1; }
        }
        @keyframes bureauDustFloat {
          0% { transform: translate(0, 0); opacity: 0; }
          10% { opacity: .5; }
          90% { opacity: .3; }
          100% { transform: translate(var(--dx), -160px); opacity: 0; }
        }
        @keyframes bureauNodePulse {
          0%, 100% { opacity: .35; transform: translate(-50%, -50%) scale(.7); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
        }
        @keyframes bureauReveal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bureauObjectReveal {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 24px)) scale(.97); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes bureauShadowSway {
          0%, 100% { transform: translateX(-50%) scaleX(1) skewX(0deg); }
          50% { transform: translateX(-50%) scaleX(1.04) skewX(1.4deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .bureau-motion { animation: none !important; transition: none !important; }
        }
      `}</style>

      <Image
        src="/home/background.png"
        alt=""
        fill
        priority
        draggable={false}
        sizes="100vw"
        className="pointer-events-none z-0 object-cover object-center brightness-100 saturate-[1.04]"
      />

      <div className="pointer-events-none absolute inset-0 z-[8] bg-[radial-gradient(72%_64%_at_48%_50%,transparent_42%,rgba(5,4,3,.5)_82%,rgba(2,2,1,.9)_100%)]" />

      <div className="bureau-motion pointer-events-none absolute top-[46%] left-[44%] z-[3] -mt-[550px] -ml-[550px] size-[1100px] mix-blend-screen transition-all duration-700 max-md:top-[34%] max-md:left-1/2 max-md:-mt-[380px] max-md:-ml-[380px] max-md:size-[760px]">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(226,170,86,.5),rgba(200,146,61,.24)_42%,rgba(150,96,30,.08)_66%,transparent_78%)]" />
        <div className="bureau-motion absolute inset-[12%] [animation:bureauLampBreathe_8s_ease-in-out_infinite] rounded-full bg-[radial-gradient(closest-side,rgba(255,224,150,.45),transparent_64%)]" />
        {dustMotes.map((mote) => (
          <span
            key={`${mote.left}-${mote.top}-${mote.delay}`}
            className={`bureau-motion absolute rounded-full bg-[rgba(255,232,178,.68)] shadow-[0_0_5px_rgba(255,224,150,.5)] ${mote.size}`}
            style={{
              animation: `bureauDustFloat ${mote.duration}s linear ${mote.delay}s infinite`,
              left: `${mote.left}%`,
              top: `${mote.top}%`,
              ["--dx" as string]: `${mote.dx}px`,
            }}
          />
        ))}
      </div>

      <div className="bureau-motion pointer-events-none absolute top-[13%] left-[14%] z-[6] -mt-[230px] -ml-[230px] size-[460px] [animation:bureauLampBreathe_8s_ease-in-out_infinite] rounded-full bg-[radial-gradient(closest-side,rgba(255,221,150,.85),rgba(238,180,92,.4)_38%,rgba(180,120,40,.12)_62%,transparent_76%)] mix-blend-screen max-md:top-[14%] max-md:left-[30%] max-md:-mt-[180px] max-md:-ml-[180px] max-md:size-[360px]" />

      <div className="bureau-motion pointer-events-none absolute top-[14%] left-1/2 z-[9] w-full -translate-x-1/2 -translate-y-1/2 [animation:bureauReveal_1.2s_ease_.9s_both] px-6 text-center max-md:top-[92%] max-md:-translate-y-full">
        <h1 className="text-[clamp(34px,5.4vw,72px)] leading-none font-semibold tracking-[.06em] whitespace-nowrap text-[#ecd6a6] [text-shadow:0_2px_30px_rgba(200,146,61,.45),0_1px_2px_rgba(0,0,0,.6)]">
          Тайное&nbsp;Бюро
        </h1>
        <p
          className={`${ebGaramond.className} mt-3.5 text-[clamp(14px,1.5vw,19px)] tracking-[.16em] text-[rgba(214,189,140,.62)] uppercase italic`}
        >
          Ночной архив · выберите предмет
        </p>
      </div>

      {objects.map((item, index) => (
        <Link
          key={item.caption}
          href={item.href}
          aria-label={item.caption}
          className={`group bureau-motion absolute z-[4] ${item.position} -translate-x-1/2 -translate-y-1/2 cursor-pointer [animation:bureauObjectReveal_.8s_ease_${1.15 + index * 0.12}s_both] hover:z-[7] max-md:left-1/2 ${index === 0 ? "max-md:top-[34%]" : ""} ${index === 1 ? "max-md:top-[55%]" : ""} ${index === 2 ? "max-md:top-[77%]" : ""}`}
        >
          <span className="bureau-motion pointer-events-none absolute -bottom-5 left-1/2 z-[-1] h-8 w-[82%] -translate-x-1/2 [animation:bureauShadowSway_8s_ease-in-out_infinite] rounded-full bg-[radial-gradient(closest-side,rgba(0,0,0,.7),rgba(0,0,0,.4)_44%,transparent_76%)] opacity-70 blur transition-all duration-700 group-hover:w-[94%] max-md:-bottom-3" />
          <Image
            src={item.image}
            alt={item.alt}
            width={1536}
            height={1024}
            draggable={false}
            className={`${item.size} pointer-events-none block h-auto drop-shadow-[0_10px_18px_rgba(0,0,0,.55)] transition duration-500 group-hover:-translate-y-2 group-hover:scale-105 group-hover:drop-shadow-[0_0_26px_rgba(255,200,110,.5)] max-md:w-[min(62vw,300px)]`}
          />
          {item.nodes &&
            mapNodes.map(([left, top, delay, size]) => (
              <span
                key={`${left}-${top}`}
                className={`bureau-motion pointer-events-none absolute z-[3] rounded-full bg-[radial-gradient(closest-side,#fff3cf,#ffce72_45%,rgba(210,140,50,.4)_80%)] mix-blend-screen shadow-[0_0_8px_2px_rgba(255,206,114,.9),0_0_16px_4px_rgba(255,180,80,.4)] ${size}`}
                style={{
                  animation: `bureauNodePulse 3.6s ease-in-out ${delay} infinite`,
                  left,
                  top,
                }}
              />
            ))}
          <span className="pointer-events-none absolute top-[46%] left-1/2 z-[2] h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,214,138,.55),rgba(220,160,80,.22)_48%,transparent_72%)] opacity-0 mix-blend-screen transition-opacity duration-500 group-hover:opacity-100" />
          <span
            className={`${ebGaramond.className} pointer-events-none absolute top-[calc(100%+22px)] left-1/2 z-[9] -translate-x-1/2 translate-y-2 text-[27px] font-medium whitespace-nowrap text-[#f0dcab] italic opacity-0 transition duration-500 [text-shadow:0_2px_18px_rgba(200,146,61,.6)] group-hover:translate-y-0 group-hover:opacity-100 max-md:top-[calc(100%+10px)] max-md:text-[21px]`}
          >
            {item.caption}
          </span>
        </Link>
      ))}
    </section>
  );
}
