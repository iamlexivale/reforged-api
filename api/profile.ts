import { DataTypes, Model } from 'sequelize';
import sequelize from './db';

class Profile extends Model {
  public uuid!: string;
  public data!: string;
  public is_saved!: string;
}

Profile.init(
  {
    uuid: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    data: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_saved: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'mmoprofiles_playerdata',
    timestamps: false,
  }
);

export default Profile;
