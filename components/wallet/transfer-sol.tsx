"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { transferSol } from "@/lib/sol";
import { zodResolver } from "@hookform/resolvers/zod";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import SubmitButton from "../ui/submit-button";

const formSchema = z.object({
  address: z
    .string()
    .min(15, "Address must be at least 15 characters.")
    .max(100, "Address must be at most 100 characters."),
  amount: z.coerce
    .number({
      message: "Amount must be a number.",
    })
    .min(0.01, "Amount must be at least 0.01"),
});

const Transfer = ({ privateKey }: { privateKey: string }) => {
  const secretKey = bs58.decode(privateKey);
  const keypair = Keypair.fromSecretKey(secretKey);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      amount: 0,
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      await transferSol(keypair, data.address, data.amount);
      toast.success("Transaction successful.");
    } catch (error) {
      console.log(error, "error");
      toast.error("Unable to make transaction.");
    }
  }

  return (
    <Dialog>
      <DialogTrigger>
        <Button>Send</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Transfer SOL?</DialogTitle>
        </DialogHeader>

        <Separator className="mb-3" />

        <DialogDescription className="mb-4 text-gray-700">
          Are you sure, you want to transfer SOL?
        </DialogDescription>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex gap-5 flex-col">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Amount"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number(e.target.valueAsNumber))
                        }
                        value={Number(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex mt-5 w-full items-center justify-end gap-2 bg-transparent">
              <DialogClose>
                <Button
                  type="button"
                  variant={"outline"}
                  // onClick={handleClear}
                  className="w-fit rounded-[4px] px-6 py-3 text-sm font-semibold text-[#666666] md:text-base md:font-bold"
                >
                  Cancel
                </Button>
              </DialogClose>
              <SubmitButton
                type="submit"
                isSubmitting={form.formState.isSubmitting}
                className="w-fit rounded-[4px] text-sm font-semibold text-white md:text-base md:font-bold"
              >
                Save
              </SubmitButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default Transfer;
