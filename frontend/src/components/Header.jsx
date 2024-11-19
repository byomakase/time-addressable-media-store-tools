import { TopNavigation } from "@cloudscape-design/components";
import { useAuthenticator } from "@aws-amplify/ui-react";

const Header = () => {
  const { user, signOut } = useAuthenticator((context) => [context.user]);

  const handleDropdownClick = ({ detail }) => {
    if (detail.id === "signout") {
      signOut();
    }
  };

  return (
    <TopNavigation
      identity={{
        href: "/",
        title: "TAMS Tools",
      }}
      utilities={[
        {
          type: "menu-dropdown",
          text: user.signInDetails.loginId,
          iconName: "user-profile",
          onItemClick: handleDropdownClick,
          items: [{ id: "signout", text: "Sign out" }],
        },
      ]}
    />
  );
};

export default Header;
