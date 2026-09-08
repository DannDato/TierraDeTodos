export default (sequelize, DataTypes) => {

    const user_connected_accounts = sequelize.define(
        'user_connected_accounts',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },

            userId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            /*
             * Proveedor de identidad.
             *
             * GOOGLE
             * DISCORD
             * MICROSOFT
             * TWITCH
             * etc.
             */
            provider: {
                type: DataTypes.STRING(32),
                allowNull: false
            },

            /*
             * ID ÚNICO que entrega el proveedor.
             *
             * Google  -> sub
             * Discord -> user.id
             * etc.
             *
             * ÉSTA es la identidad real del proveedor.
             * Nunca utilizar email como identificador primario.
             */
            providerUserId: {
                type: DataTypes.STRING(255),
                allowNull: false
            },

            /*
             * Email reportado por el proveedor.
             *
             * Es informativo y puede cambiar.
             */
            providerEmail: {
                type: DataTypes.STRING(255),
                allowNull: true
            },

            displayName: {
                type: DataTypes.STRING(255),
                allowNull: true
            },

            avatarUrl: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            lastUsedAt: {
                type: DataTypes.DATE,
                allowNull: true
            }

        },
        {
            tableName: 'user_connected_accounts',

            timestamps: true,

            indexes: [

                /*
                 * Una identidad externa sólo puede pertenecer
                 * a UN usuario de Tierra de Todos.
                 *
                 * GOOGLE + 123456789
                 * nunca puede estar conectado a dos Users.
                 */
                {
                    name: 'connected_account_provider_user_unique',
                    unique: true,
                    fields: [
                        'provider',
                        'providerUserId'
                    ]
                },

                {
                    name: 'connected_accounts_user_idx',
                    fields: [
                        'userId'
                    ]
                },

                {
                    name: 'connected_accounts_provider_idx',
                    fields: [
                        'provider'
                    ]
                }
            ]
        }
    );


    user_connected_accounts.associate = (models) => {

        user_connected_accounts.belongsTo(
            models.Users,
            {
                foreignKey: 'userId',
                as: 'user',
                constraints: false
            }
        );

    };


    return user_connected_accounts;
};