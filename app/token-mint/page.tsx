import React from "react";
import ClientPage from "./client-page";
import { getCookie } from "cookies-next/server";
import { cookies } from "next/headers";
import bs58 from "bs58";

const page = async () => {
  const activeAccount = (await getCookie("activeAccount", { cookies })) ?? "";
  const parsed = JSON.parse(activeAccount);
  const secret = bs58.decode(parsed.privateKey);
  return (
    <div>
      <ClientPage secret={secret} />
    </div>
  );
};

export default page;
