﻿using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace TW.Vault
{
    public static class Configuration
    {
        private static IConfigurationRoot cachedRoot;
        private static DateTime rootCachedAt = new DateTime();
        private static TimeSpan configurationRefreshRate = TimeSpan.FromSeconds(10);

        public static IConfigurationRoot Instance
        {
            get
            {
                var now = DateTime.Now;
                if (now - rootCachedAt >= configurationRefreshRate)
                {
                    var builder = new ConfigurationBuilder().ApplyVaultConfiguration();

                    cachedRoot = builder.Build();
                    rootCachedAt = now;
                }

                return cachedRoot;
            }
        }

        public static String ConnectionString
        {
            get
            {
                var connectionStrings = Instance.GetSection("ConnectionStrings");
                var directConnectionString = connectionStrings.GetValue<String>("Vault");
                if (directConnectionString != null)
                    return directConnectionString;

                var connectionOptions = connectionStrings.GetSection("Vault");

                var paramParts = new Dictionary<String, String>
                {
                    { "Server", connectionOptions["Server"] },
                    { "Port", connectionOptions["Port"] },
                    { "Database", connectionOptions["Database"] },
                    { "User Id", connectionOptions["User"] },
                    { "Password", connectionOptions["Password"] }
                };

                return String.Join("; ", paramParts.Select(kvp => $"{kvp.Key}={kvp.Value}"));
            }
        }

        public static SecurityConfiguration Security
        {
            get
            {
                SecurityConfiguration cfg = new SecurityConfiguration();
                Instance.GetSection("Security").Bind(cfg);
                return cfg;
            }
        }

        public static InitializationConfiguration Initialization
        {
            get
            {
                InitializationConfiguration cfg = new InitializationConfiguration();
                Instance.GetSection("Initialization").Bind(cfg);
                return cfg;
            }
        }

        public static BehaviorConfiguration Behavior
        {
            get
            {
                BehaviorConfiguration cfg = new BehaviorConfiguration();
                cfg.Map = new MapBehaviorConfiguration();
                Instance.GetSection("Behavior").Bind(cfg);
                Instance.GetSection("Behavior:Map").Bind(cfg.Map);
                Instance.GetSection("Behavior:Tagging").Bind(cfg.Tagging);
                Instance.GetSection("Behavior:Notifications").Bind(cfg.Notifications);
                return cfg;
            }
        }

        public static RankingsConfiguration Rankings
        {
            get
            {
                RankingsConfiguration cfg = new RankingsConfiguration();
                Instance.GetSection("Rankings").Bind(cfg);
                return cfg;
            }
        }
    }

    public class SecurityConfiguration
    {
        public bool AllowUploadArmyForNonOwner { get; set; }
        public bool ReportIgnoreExpectedPopulationBounds { get; set; }
        public bool AllowCommandArrivalBeforeServerTime { get; set; }
        public bool RestrictAccessWithinTribes { get; set; }

        public short MinimumRequiredPriveleges { get; set; }

        public bool UseEncryption { get; set; } = true;

        public bool EnableScriptFilter { get; set; }
        public List<String> PublicScripts { get; set; }

        public Guid? ForcedKey { get; set; }
        public long? ForcedPlayerId { get; set; }
        public long? ForcedTribeId { get; set; }
    }

    public class BehaviorConfiguration
    {
        public MapBehaviorConfiguration Map { get; set; }
        public TaggingBehaviorConfiguration Tagging { get; set; }
        public NotificationBehaviorConfiguration Notifications { get; set; }
    }

    public class MapBehaviorConfiguration
    {
        public int MaxDaysSinceReportUpload { get; set; } = 1;
        public int MaxDaysSinceTroopUpload { get; set; } = 3;
        public int MaxDaysSinceCommandUpload { get; set; } = 3;
        public int MaxDaysSinceIncomingsUpload { get; set; } = 3;
    }

    public class TaggingBehaviorConfiguration
    {
        public int MaxDaysSinceReportUpload { get; set; } = 1;
        public int MaxDaysSinceTroopUpload { get; set; } = 3;
        public int MaxDaysSinceCommandUpload { get; set; } = 3;
        public int MaxDaysSinceIncomingsUpload { get; set; } = 3;
    }

    public class NotificationBehaviorConfiguration
    {
        public bool NotificationsEnabled { get; set; } = true;

        public String TwilioSourcePhoneNumber { get; set; }
        public String TwilioClientKey { get; set; }
        public String TwilioClientSecret { get; set; }

        public int NotificationCheckInterval { get; set; } = 1000;
        public int MaxNotificationsPerMessage { get; set; } = 3;
    }

    public class InitializationConfiguration
    {
        public bool EnableRequiredFiles { get; set; }
        public List<String> RequiredFiles { get; set; }
    }

    public class RankingsConfiguration
    {
        public bool EnableRankingsService { get; set; } = true;
        public int RefreshCheckIntervalSeconds { get; set; } = 300;
    }

    public class ExplicitConnectionString
    {
        public String Server { get; set; }
        public int Port { get; set; }
        public String Database { get; set; }
        public String User { get; set; }
        public String Password { get; set; }
    }
}
