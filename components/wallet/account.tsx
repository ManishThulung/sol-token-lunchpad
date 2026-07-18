const Account = ({ publicKey }: { publicKey: string }) => {
  return (
    <div className="flex gap-2 flex-col">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 items-center">
          <p>Private Key: </p>
          <span>................</span>
        </div>
      </div>
      <div className="flex gap-4 items-center">
        <p>Public Key: </p>
        <span>{publicKey}</span>
      </div>
    </div>
  );
};

export default Account;
