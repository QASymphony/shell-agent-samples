from functions import get_config

qtest_config = get_config()
repo = qtest_config["local_repository"]
print(repo)