import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import React from "react";
// import { AnimatedTooltip } from "@/components/ui/animated-tooltip";

interface IProps {
  children: React.ReactNode;
  title: string;
  subTitle?: string;
  // type?: "Add" | "Edit";
  // link?: string;
  // id?: string;
  // icon?: React.ReactNode;
  // tooltip?: string;
  className?: string;
  titleImgUlr?: string;
  bodyClassName?: string;
}

const CardWrapper = ({
  children,
  title,
  subTitle,
  className,
  titleImgUlr,
  bodyClassName,
}: IProps) => {
  return (
    <div
      className={cn(
        "w-full rounded-[8px] bg-[#FFFFFF] hover:shadow-sm",
        className,
      )}
    >
      <div className="w-full">
        <div className="flex h-[60px] items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-5">
            {titleImgUlr && (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_7516_38026)">
                  <rect width="24" height="24" rx="12" fill="white" />
                  <path
                    d="M8.35909 0.789921C5.96112 1.6218 3.89311 3.20073 2.45882 5.2948C1.02454 7.38887 0.299573 9.88769 0.390418 12.4242C0.481264 14.9608 1.38313 17.4013 2.96355 19.3874C4.54396 21.3735 6.71962 22.8005 9.17096 23.4587C11.1583 23.9715 13.2405 23.994 15.2385 23.5243C17.0484 23.1177 18.7218 22.2481 20.0947 21.0005C21.5236 19.6624 22.5608 17.9602 23.0947 16.0768C23.6751 14.0287 23.7783 11.8748 23.3966 9.78055H12.2366V14.4099H18.6997C18.5705 15.1483 18.2937 15.853 17.8859 16.4819C17.478 17.1107 16.9474 17.6509 16.326 18.0699C15.5367 18.592 14.6471 18.9432 13.7141 19.1012C12.7784 19.2752 11.8186 19.2752 10.8828 19.1012C9.93444 18.9051 9.03727 18.5137 8.24846 17.9518C6.98124 17.0548 6.02973 15.7804 5.52971 14.3105C5.02124 12.8132 5.02124 11.1898 5.52971 9.69242C5.88564 8.64283 6.47403 7.68717 7.25096 6.8968C8.14007 5.9757 9.26571 5.31729 10.5044 4.99381C11.743 4.67034 13.0469 4.69429 14.2728 5.06305C15.2305 5.35703 16.1063 5.87068 16.8303 6.56305C17.5591 5.83805 18.2866 5.11117 19.0128 4.38242C19.3878 3.99055 19.7966 3.61742 20.166 3.21617C19.0608 2.18769 17.7635 1.3874 16.3485 0.861171C13.7717 -0.0744733 10.9522 -0.0996178 8.35909 0.789921Z"
                    fill="white"
                  />
                  <path
                    d="M8.36266 0.790832C10.9555 -0.0993112 13.775 -0.0748285 16.352 0.860207C17.7673 1.39001 19.064 2.19415 20.1677 3.22646C19.7927 3.62771 19.397 4.00271 19.0145 4.39271C18.287 5.11896 17.5602 5.84271 16.8339 6.56396C16.1099 5.87159 15.2341 5.35794 14.2764 5.06396C13.0509 4.69391 11.7471 4.66857 10.5081 4.99072C9.26907 5.31288 8.14274 5.97007 7.25266 6.89021C6.47572 7.68059 5.88733 8.63624 5.53141 9.68583L1.64453 6.67646C3.0358 3.91751 5.44469 1.80713 8.36266 0.790832Z"
                    fill="#E33629"
                  />
                  <path
                    d="M0.611401 9.65508C0.820316 8.61969 1.16716 7.617 1.64265 6.67383L5.52953 9.6907C5.02105 11.1881 5.02105 12.8114 5.52953 14.3088C4.23453 15.3088 2.9389 16.3138 1.64265 17.3238C0.452308 14.9544 0.0892746 12.2548 0.611401 9.65508Z"
                    fill="#F8BD00"
                  />
                  <path
                    d="M12.2391 9.7793H23.3991C23.7809 11.8735 23.6776 14.0274 23.0972 16.0755C22.5633 17.9589 21.5261 19.6612 20.0972 20.9993C18.8429 20.0205 17.5829 19.0493 16.3285 18.0705C16.9504 17.6511 17.4812 17.1103 17.8891 16.4808C18.297 15.8512 18.5735 15.1458 18.7022 14.4068H12.2391C12.2372 12.8655 12.2391 11.3224 12.2391 9.7793Z"
                    fill="#587DBD"
                  />
                  <path
                    d="M1.64062 17.3236C2.93687 16.3236 4.2325 15.3186 5.5275 14.3086C6.02851 15.779 6.98138 17.0534 8.25 17.9498C9.04127 18.5091 9.94037 18.8973 10.89 19.0898C11.8257 19.2638 12.7855 19.2638 13.7213 19.0898C14.6542 18.9319 15.5439 18.5807 16.3331 18.0586C17.5875 19.0373 18.8475 20.0086 20.1019 20.9873C18.7292 22.2356 17.0558 23.1059 15.2456 23.513C13.2476 23.9827 11.1655 23.9601 9.17813 23.4473C7.60632 23.0277 6.13814 22.2878 4.86563 21.2742C3.51874 20.2049 2.41867 18.8573 1.64062 17.3236Z"
                    fill="#319F43"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_7516_38026">
                    <rect width="24" height="24" rx="12" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            )}

            <p className="text-xl font-medium">
              <span className="text-base font-medium text-black md:text-xl">
                {title}
              </span>
              {subTitle && (
                <span className="flex h-3 items-center text-[10px] font-normal text-[#666666]">
                  {subTitle}
                </span>
              )}
            </p>
          </div>

          {/* <div className="flex flex-shrink-0 items-center">
            {type && (
              <Link
                href={link ?? "#"}
                className={cn(
                  "mr-4 flex items-center justify-center gap-2 p-2 md:p-3",
                  type == "Edit"
                    ? "rounded-[4px] border bg-[#FFFFFF] text-black hover:bg-gray-300"
                    : "rounded-[4px] bg-primary hover:bg-blue-800",
                )}
              >
                <Image
                  src={
                    type == "Add"
                      ? "/underline-pencil-white.svg"
                      : "/underline-pencil.svg"
                  }
                  alt="icon"
                  width={20}
                  height={20}
                  className="h-4 w-4"
                />
                <span
                  className={`text-sm font-medium ${type === "Edit" ? "text-black" : "text-white"}`}
                >
                  {type}
                </span>
              </Link>
            )}
            {icon && tooltip && (
              <div className="mr-6">
                <AnimatedTooltip
                  items={[
                    {
                      id: 1,
                      name: tooltip,
                      icon: icon,
                    },
                  ]}
                />
              </div>
            )}
          </div> */}
        </div>

        <Separator />
        <div className={`${bodyClassName ? bodyClassName : "p-3 md:p-6"}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default CardWrapper;
