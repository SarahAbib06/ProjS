// frontend/src/services/profileService.js
import api from "./api";


export const profileService = {

  //  1. Récupérer le profil
  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data.user;
  },

  //  2. Modifier le username
updateUsername: async (newUsername) => {
  try {
    const response = await api.put("/auth/profile/username", {
      username: newUsername,
    });

    return response.data.user;

  } catch (err) {
    // on remonte le message envoyé par le backend !
    throw new Error(err.response?.data?.message || "Erreur lors de la mise à jour.");
  }
},


  // 3. Upload photo de profil
 uploadProfilePicture: async (file) => {
    const formData = new FormData();

    
    formData.append("profile", file);

    const response = await api.post("/auth/upload-profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.user;
  },
     // 4. Supprimer le compte
  deleteAccount: async (password) => {
  try {
    const response = await api.post("/auth/delete-account", { password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur serveur" };
  }
},


   deleteProfilePicture: async () => {
  try {
    const response = await api.delete("/auth/profile/picture");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur serveur" };
  }
}


};

