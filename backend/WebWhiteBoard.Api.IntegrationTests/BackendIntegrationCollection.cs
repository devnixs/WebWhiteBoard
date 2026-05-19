namespace WebWhiteBoard.Api.IntegrationTests;

[CollectionDefinition(Name)]
public sealed class BackendIntegrationCollection : ICollectionFixture<PostgresFixture>
{
    public const string Name = "backend-api-integration";
}
