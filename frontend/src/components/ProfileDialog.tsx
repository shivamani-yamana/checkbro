import { useState, useEffect } from "react";
import { usePlayerContext } from "@/contexts/PlayerContext";
import Button from "./Button";

interface ProfileDialogProps {
  show: boolean;
  onClose: () => void;
}

function ProfileDialog({ show, onClose }: ProfileDialogProps) {
  const { playerName, declarePlayerName } = usePlayerContext();

  const [profileNameValue, setProfileNameValue] = useState(playerName || "");
  const [profileNameError, setProfileNameError] = useState<string | null>(null);

  useEffect(() => {
    setProfileNameValue(playerName || "");
  }, [playerName]);

  // Validation function for names
  const validateName = (name: string) => {
    const nameRegex = /^[A-Za-z]{3,14}$/;
    return nameRegex.test(name);
  };

  const handleNameSubmit = () => {
    // Validate name
    if (!validateName(profileNameValue)) {
      setProfileNameError(
        "Name must be 3-14 characters and contain only alphabets"
      );
      return;
    }

    declarePlayerName(profileNameValue);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg text-center shadow-xl w-80">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Your Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-left text-sm font-medium text-gray-400 mb-1">
            Player Name
          </label>
          <input
            type="text"
            value={profileNameValue}
            onChange={(e) => {
              setProfileNameValue(e.target.value);
              setProfileNameError(null);
            }}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mb-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your name"
          />
          {profileNameError && (
            <p className="text-red-400 text-sm text-left">{profileNameError}</p>
          )}
        </div>

        <div className="flex space-x-3">
          <Button onClick={onClose} color="gray" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleNameSubmit}
            color="green"
            className="flex-1"
            disabled={profileNameValue.length < 3}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProfileDialog;
