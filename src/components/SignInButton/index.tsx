interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  rightIcon?: React.ReactNode;
}

const SignInButton = () => {
  const client_id = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID;
  const neynar_login_url =
    process.env.NEXT_PUBLIC_NEYNAR_LOGIN_URL || "https://app.neynar.com/login";

  if (!client_id) {
    throw new Error("NEXT_PUBLIC_NEYNAR_CLIENT_ID is not defined in .env");
  }

  return (
    <div
      className="neynar_signin mt-6"
      data-client_id={client_id}
      data-neynar_login_url={neynar_login_url}
      data-success-callback="onSignInSuccess"
      data-theme={"light"}
      data-variant={"warpcast"}
      data-logo_size={"30px"}
      data-height={"48px"}
      data-width={"218px"}
      data-border_radius={"10px"}
      data-font_size={"16px"}
      data-font_weight={"300"}
      data-padding={"8px 15px"}
      data-margin={"0px"}
      // data-text={""}
      // data-color={""}
      // data-background_color={""}
      // data-styles={""}
      // data-custom_logo_url={""}
    ></div>
  );
};

export default SignInButton;