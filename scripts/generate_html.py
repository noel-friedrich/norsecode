import os

templates_dir = "templates"
helpers_dir = "templates/helpers"
output_dir = ""

def get_files(dir):
    return [f for f in os.listdir(dir) if os.path.isfile(os.path.join(dir, f))]

template_files = get_files(templates_dir)
helper_files = get_files(helpers_dir)

def parse_file_configs(file_content):
    file_configs = {}
    new_file_content = ""
    reading_config = False
    for line in file_content.split("\n"):
        if line == "~START-CONFIG~":
            reading_config = True
            continue
        elif line == "~END-CONFIG~":
            reading_config = False
            continue
        if reading_config:
            key, value = line.split(":", 1)
            file_configs[key] = value.strip()
        else:
            new_file_content += line + "\n"
    
    if "destination" in file_configs:
        file_configs["path-to-ground"] = "../" * (len(file_configs["destination"].split("/")) - 1)
    return new_file_content, file_configs

def parse_file_content(file_content, isHelper=False):
    if not isHelper:
        for helper_file in helper_files:
            with open(os.path.join(helpers_dir, helper_file), "r") as f:
                helper_content = f.read()
                replace_text = f"${helper_file}$"
                helper_content, _ = parse_file_content(helper_content, True)
                file_content = file_content.replace(replace_text, helper_content)
    file_content, file_configs = parse_file_configs(file_content)
    for key, value in file_configs.items():
        file_content = file_content.replace(f"${key}$", value)
    return file_content, file_configs

for template_file in template_files:
    with open(os.path.join(templates_dir, template_file), "r") as f:
        file_content, file_configs = parse_file_content(f.read())
        destination_file = file_configs["destination"]
        with open(os.path.join(output_dir, destination_file), "w") as f:
            f.write(file_content.strip())
            print(f"Generated {destination_file} from {os.path.join(templates_dir, template_file)}.")