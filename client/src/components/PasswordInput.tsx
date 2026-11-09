import { useState } from "react";

function PasswordInput() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="password-container">
      <input 
        type={showPassword ? "text": "password"}
        placeholder="Contraseña"
      />
    </div>
  );
}

export default PasswordInput;